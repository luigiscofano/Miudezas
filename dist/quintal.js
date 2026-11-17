// As cenas usam a mesma grade de 96 pixels do visor.
function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function sprite(ctx, rows, colors, x, y, mirror = false) {
  rows.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      const color = colors[row[dx]];
      if (color) rect(ctx, color, x + (mirror ? row.length - dx - 1 : dx), y + dy, 1, 1);
    }
  });
}

// O traço de um pixel conserva os degraus do desenho, inclusive nas diagonais.
function line(ctx, color, x0, y0, x1, y1) {
  x0 = Math.round(x0);
  y0 = Math.round(y0);
  x1 = Math.round(x1);
  y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const stepX = x0 < x1 ? 1 : -1;
  const stepY = y0 < y1 ? 1 : -1;
  let error = dx + dy;
  for (;;) {
    rect(ctx, color, x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) return;
    const twice = 2 * error;
    if (twice >= dy) { error += dy; x0 += stepX; }
    if (twice <= dx) { error += dx; y0 += stepY; }
  }
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const delta = {left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1]};

function goteira(level, api, options = {}) {
  const endless = options.mode === 'endless';
  const floodLimit = endless ? 8 : [12, 9, 6][level - 1];
  const ink = '#131a37', wall = '#354e76', rain = '#83ddf4', gold = '#e1ad45';
  const lanes = [24, 50, 76], sequence = [1, 2, 1, 0, 2, 0, 1, 0, 2, 1, 2, 0, 2];
  const held = new Set();
  const drops = [];
  const splashes = [];
  const interval = [1.85, 1.52, 1.20][level - 1];
  const speed = [27, 34, 40][level - 1];
  let x = 48, time = 0, next = 0.2, index = 0, bucket = 0, score = 0, bounce = 0, done = false, spilled = 0;
  function spill(drop) {
    spilled++;
    splashes.push({x: drop.x, life: 0.4});
    if (spilled >= floodLimit && !done) {
      done = true;
      api.finish(false, 'O chão alagou! ' + score + ' gotas recolhidas.');
    }
  }
  return {
    press(dir) { held.add(dir); },
    release(dir) { held.delete(dir); },
    update(dt) {
      if (done) return;
      time += dt;
      bounce = Math.max(0, bounce - dt);
      x = clamp(x + (Number(held.has('right')) - Number(held.has('left'))) * 66 * dt, 6, 90);
      if (x < 13 && bucket) { bucket = 0; api.tone(175, 0.12); }
      if (time >= next) {
        const lane = sequence[index++ % sequence.length];
        drops.push({x: lanes[lane], y: 12 + lane * 2, wait: 0.55});
        next += endless ? Math.max(1.35, interval - score * 0.008) : interval;
      }
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        if (d.wait > 0) { d.wait -= dt; continue; }
        const previousY = d.y;
        d.y += (endless ? Math.min(36, speed + score * 0.12) : speed) * dt;
        if (previousY < 79 && d.y >= 79 && Math.abs(x - d.x) <= 6) {
          // A gota é removida nesta passagem: nunca transborda duas vezes.
          if (bucket < 4) {
            bucket++; score++; bounce = 0.18;
            api.tone(330 + bucket * 95, 0.065);
          } else spill(d);
          drops.splice(i, 1);
        } else if (d.y >= 87) {
          spill(d); drops.splice(i, 1);
        }
        if (done) return;
      }
      for (let i = splashes.length - 1; i >= 0; i--) {
        splashes[i].life -= dt;
        if (splashes[i].life <= 0) splashes.splice(i, 1);
      }
      if (!endless && time >= 60) {
        done = true;
        api.finish(score > 0, score + (score === 1 ? ' gota recolhida.' : ' gotas recolhidas.'));
      }
    },
    draw(ctx) {
      rect(ctx, ink, 0, 0, 96, 96);
      rect(ctx, wall, 0, 0, 96, 10);
      rect(ctx, wall, 29, 10, 67, 2);
      rect(ctx, wall, 62, 12, 34, 2);
      lanes.forEach((x, i) => {
        const y = 8 + 2 * i;
        line(ctx, ink, x + 2, y - 4, x - 1, y + 1);
        rect(ctx, wall, x - 1, y + 1, 2, 4);
      });
      const pane = '#304565';
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) rect(ctx, pane, 9 + 8 * c, 37 + 8 * r, 6, 6);
      rect(ctx, wall, 0, 88, 96, 3);
      if (spilled) rect(ctx, '#287f9b', 16, 87, Math.min(80, Math.ceil(80 * spilled / floodLimit)), 2);
      rect(ctx, wall, 4, 86, 10, 3);
      for (let i = 0; i < 3; i++) rect(ctx, ink, 5 + 3 * i, 87, 2, 1);
      for (const d of drops) {
        rect(ctx, rain, d.x, d.y, 2, d.wait > 0 ? 1 : 3);
        if (d.wait <= 0) rect(ctx, '#c1f2ef', d.x, d.y, 1, 1);
      }
      for (const s of splashes) {
        rect(ctx, rain, s.x - 2, 86, 1, 1);
        rect(ctx, rain, s.x + 3, 85, 1, 1);
      }
      const by = bounce > 0 ? 80 : 79;
      rect(ctx, gold, x - 6, by, 12, 2);
      rect(ctx, gold, x - 5, by + 2, 10, 4);
      rect(ctx, gold, x - 4, by + 6, 8, 3);
      rect(ctx, ink, x - 4, by, 8, 1);
      line(ctx, gold, x + 5, by + 1, x + 8, by + 5);
      line(ctx, gold, x + 8, by + 5, x + 5, by + 7);
      for (let i = 0; i < bucket; i++) rect(ctx, rain, x - 4 + i * 2, by + 1, 2, 1);
    },
    score() { return score; },
    snapshot() { return {x, bucket, spilled, floodLimit, score, done, drops: drops.map(d => ({...d}))}; },
    hud() { return (endless ? 'Sem Parar' : Math.max(0, 60 - Math.floor(time)) + ' s') + ' · Balde ' + bucket + '/4 · ' + score + ' gotas · Chão ' + spilled + '/' + floodLimit; }
  };
}

const shores = [
  ['~~~~....','~~~~..C.','~~~...#.','~~~=....','..==~~~~','....~~~~','.S..~~~~','...~~~~~'],
  ['~~~~~...','~~~~~.C.','~~..=..#','~~..#~~~','~.=.~~~~','...~~~~~','S.#~~~~~','...~~~~~'],
  ['~~~~~..C','~~~~~#..','~~~..=..','~~~#..~~','~..=.~~~','~..#~~~~','..=.~~~~','S..~~~~~']
];
// Busca no estado completo: posição, fase da maré e última areia segura.
export function resolverMare(grid) {
  let start;
  grid.forEach((r,y)=>{if(r.includes('S')) start=[r.indexOf('S'),y];});
  if (!start) return null;
  const queue=[{x:start[0],y:start[1],phase:0,sx:start[0],sy:start[1],path:[]}], seen=new Set();
  for(let head=0;head<queue.length && head<24576;head++) {
    const at=queue[head];
    for(const [dir,[dx,dy]] of Object.entries(delta)) {
      let x=at.x+dx,y=at.y+dy; const cell=grid[y]?.[x];
      if(!cell || cell==='~' || cell==='#' || (cell==='=' && at.phase>=3)) continue;
      const phase=(at.phase+1)%6, sx=cell==='='?at.sx:x, sy=cell==='='?at.sy:y;
      const path=[...at.path,dir];
      if(cell==='C') return path;
      if(phase===3 && cell==='=') {x=sx;y=sy;}
      const key=[x,y,phase,sx,sy].join(',');
      if(!seen.has(key)){seen.add(key);queue.push({x,y,phase,sx,sy,path});}
    }
  }
  return null;
}

export function gerarMare(seed=1) {
  const original=Number(seed)>>>0; let state=original;
  const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  for(let attempt=0;attempt<24;attempt++) {
    const grid=Array.from({length:8},()=>Array.from({length:8},()=>random()<.48?'~':random()<.2?'#':'.'));
    // Um corredor monotônico garante distância; baixios ainda exigem validar a maré.
    let x=0,y=7; grid[y][x]='S';
    while(x<7 || y>0){if(x<7 && (y===0 || random()<.5))x++;else y--;grid[y][x]=random()<.22?'=':'.';}
    grid[0][7]='C';
    const rows=grid.map(r=>r.join('')), solution=resolverMare(rows);
    if(solution && solution.length>=14) return {seed:original,grid:rows,solution,fallback:false};
  }
  const grid=['.......C','.~~~~~~~','........','~~~~~~~.','........','.~~~~~~~','........','S~~~~~~~'];
  return {seed:original,grid,solution:resolverMare(grid),fallback:true};
}

const crab = ['r...r...r','rr.rr..rr','..rrrrrr.','.rwwwwr..','..wkwkw..','.rrrrrrr.','r.r..r..r'];

function mare(level, api, options = {}) {
  const generated = options.mode === 'generated' ? gerarMare(options.seed) : null;
  const grid = generated ? generated.grid : shores[level - 1];
  let x = 0, y = 0, sandX = 0, sandY = 0;
  grid.forEach((row, j) => { if (row.includes('S')) { x = row.indexOf('S'); y = j; } });
  sandX = x; sandY = y;
  let steps = 0, high = false, flash = 0, clock = 0, done = false, facing = false;
  function move(dir) {
    if (done || !delta[dir]) return;
    const nx = x + delta[dir][0], ny = y + delta[dir][1];
    const cell = grid[ny]?.[nx];
    if (!cell || cell === '#' || cell === '~' || (cell === '=' && high)) return;
    x = nx; y = ny; steps++;
    if (dir === 'left' || dir === 'right') facing = dir === 'left';
    if (cell !== '=') { sandX = x; sandY = y; }
    if (cell === 'C') {
      done = true; api.tone(620, 0.09); api.finish(true, 'Concha encontrada em ' + steps + ' passos.'); return;
    }
    if (steps % 3 === 0) {
      high = !high; api.tone(high ? 190 : 320, 0.06);
      if (high && cell === '=') { x = sandX; y = sandY; flash = 0.45; }
    }
  }
  return {
    snapshot() { return {grid: [...grid], x, y, steps, high, done, seed: generated?.seed}; },
    press: move, release() {},
    update(dt) { clock += dt; flash = Math.max(0, flash - dt); },
    draw(ctx) {
      for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
        const at = grid[j][i], px = i * 12, py = j * 12;
        const sea = '#116a70', shallow = high ? '#287d7e' : '#7acabb', sand = '#f6dba4';
        rect(ctx, at === '~' ? sea : at === '=' ? shallow : sand, px, py, 12, 12);
        if (at === '~' && (i * 3 + j) % 9 === 0) {
          const off = Math.floor(clock * 1.25 + j) % 2;
          rect(ctx, '#95d2c1', px + 2 + off, py + 6, 3, 1);
          rect(ctx, '#95d2c1', px + 5 + off, py + 5, 3, 1);
        }
        if (at === '=' && high) rect(ctx, '#8bcebf', px + 4, py + 6, 4, 1);
        if (at === '#') {
          rect(ctx, '#3c4450', px + 2, py + 5, 9, 5);
          rect(ctx, '#3c4450', px + 4, py + 3, 5, 3);
        }
        if (at === 'C') {
          sprite(ctx, ['..sss..','.s...s.','s.sss.s','s.s.s.s','.s..s.s','..sss..'], {s:'#bc805e'}, px + 2, py + 3);
        }
      }
      sprite(ctx, crab, {r:flash > 0 ? '#fff5da' : '#cd4c3e', w:'#fff4c9', k:'#323b43'}, x * 12 + 2, y * 12 + 3, facing);
    },
    hud() { return (high ? 'Maré alta' : 'Maré baixa') + ' · Muda em ' + (3 - steps % 3) + (steps % 3 === 2 ? ' passo' : ' passos'); }
  };
}

const bird = [
  '.....kkk....','....kwwwk...','....wkkwkkk.','...bbkyy....',
  '..bbbyyy....','.bbbbyy.....','bb..yy......','....k.k.....'
];
const wires = [30, 53, 75];

function fio(level, api, options = {}) {
  const endless = options.mode === 'endless';
  let col = 2, row = 1, score = 0, target = 0, clock = 0, hop = 0, faceLeft = false;
  let gust = 0, nextGust = [5.7, 4.9, 4.1][level - 1], danger = -1, done = false;
  const moths = [[6,0],[4,2],[1,1],[7,2],[3,0]];
  const warning = [1.65, 1.25, 0.92][level - 1];
  const birdX = i => 8 + i * 10;
  function move(dir) {
    if (done || !delta[dir]) return;
    const nx = clamp(col + delta[dir][0], 0, 8), ny = clamp(row + delta[dir][1], 0, 2);
    if (col === nx && row === ny) return;
    if (nx !== col) faceLeft = nx < col;
    col = nx; row = ny; hop = 0.17;
    if (moths[target][0] === col && moths[target][1] === row) {
      score++; api.tone(560 + 50 * Math.min(score, 12), 0.09);
      if (!endless && score === 5) { done = true; api.finish(true, 'Cinco mariposas antes da ventania.'); }
      else target = (target + 1) % moths.length;
    }
  }
  return {
    press: move, release() {},
    update(dt) {
      if (done) return;
      clock += dt; hop = Math.max(0, hop - dt);
      if (danger >= 0) {
        gust -= dt;
        if (gust <= 0) {
          if (row === danger) { done = true; api.finish(false, 'A rajada levou o bem-te-vi. Mariposas: ' + score + (endless ? '.' : '/5.')); }
          danger = -1; nextGust = endless ? Math.max(2.8, 4.3 - score * 0.04) : [4.3, 3.5, 2.8][level - 1];
        }
      } else {
        nextGust -= dt;
        if (nextGust <= 0) { danger = row; gust = endless ? Math.max(0.9, warning - score * 0.015) : warning; api.tone(210, 0.14); }
      }
    },
    draw(ctx) {
      const ink = '#352d32', peach = '#efa17f', roof = '#aa5748';
      rect(ctx, peach, 0, 0, 96, 96);
      rect(ctx, roof, 0, 92, 17, 4); rect(ctx, roof, 4, 89, 11, 3);
      rect(ctx, roof, 26, 94, 15, 2); rect(ctx, roof, 57, 92, 16, 4);
      rect(ctx, roof, 78, 90, 18, 6); rect(ctx, roof, 85, 86, 3, 6);
      wires.forEach((height, r) => {
        for (let i = 0; i < 96; i++) {
          const sag = r === row && Math.abs(i - birdX(col)) < 6 ? 1 : 0;
          const shake = danger === r ? Math.round(Math.sin(clock * 35 + i / 5) * 2) : 0;
          rect(ctx, ink, i, height + sag + shake, 1, 1);
        }
      });
      if (danger >= 0) {
        const shift = Math.floor(clock * 40) % 12;
        rect(ctx, '#ffdeac', shift, wires[danger] - 6, 7, 1);
        rect(ctx, '#ffdeac', shift + 4, wires[danger] - 4, 6, 1);
      }
      const [mx, my] = moths[target];
      const flap = Math.floor(clock * 6) % 2;
      sprite(ctx, flap ? ['w...w','ww.ww','.wkw.','..k..'] : ['.w.w.','wwkww','..k..'], {w:'#fff0c9',k:ink}, birdX(mx) - 2, wires[my] - 4);
      sprite(ctx, bird, {k:ink,w:'#fff0ca',b:'#655042',y:'#f6d052'}, birdX(col) - 5, wires[row] - 7 - Math.round(Math.sin((0.17-hop)/0.17*Math.PI)*2), faceLeft);
    },
    score() { return score; },
    hud() { return 'Mariposas ' + score + (endless ? '' : '/5') + (danger >= 0 ? ' · Fio tremendo!' : ''); }
  };
}

const skyline = [
  [81, 15], [75, 19], [85, 12], [78, 25], [83, 15], [73, 14]
];
function pipa(level, api, options = {}) {
  const endless = options.mode === 'endless';
  const held = new Set();
  const baseSpeed = [14, 17, 20][level - 1];
  const n = [4, 5, 6][level - 1];
  const towers = Array.from({length: n}, (_, i) => ({
    x: 90 + i * 70,
    top: [48, 42, 46, 38, 44, 40][i],
    cable: i % 2 === 1, counted: false
  }));
  const end = towers[n-1].x + 43;
  let scroll = 0, clock = 0, y = 37, vertical = 0, passed = 0, done = false;
  const kx = 30;
  function fail() { done = true; api.finish(false, 'A rabiola enroscou. Obstáculos ' + passed + (endless ? '' : '/' + n) + '.'); }
  return {
    press(dir) { held.add(dir); },
    release(dir) { held.delete(dir); },
    update(dt) {
      if (done) return;
      // Subpassos limitam atravessamentos de obstáculos em quadros lentos.
      if (dt > 0.025) { for(let left=dt;left>0 && !done;left-=0.025) this.update(Math.min(left,0.025)); return; }
      clock += dt; scroll += dt * (endless ? Math.min(23, baseSpeed + passed * 0.15) : baseSpeed);
      if(endless) {
        while(towers[towers.length-1].x-scroll<180) {
          const last=towers[towers.length-1];
          towers.push({x:last.x+70,top:38+(Math.floor(last.x/70)%4)*3,cable:!last.cable,counted:false});
        }
        while(towers[0].x-scroll < -20) towers.shift();
      }
      const control = Number(held.has('down')) - Number(held.has('up'));
      const breeze = Math.sin(clock * 1.33 - 0.4) * [2.5, 4.2, 6][level - 1];
      vertical += (control * 31 + breeze - vertical) * Math.min(1, 6 * dt);
      y = clamp(y + vertical * dt, 9, 64);
      for (const tower of towers) {
        const dx = tower.x - scroll - kx;
        // A ponta da rabiola se estende para trás, a três pixels do corpo.
        if (dx >= -13 && dx <= 7 && y + 10 >= tower.top - 2) { fail(); return; }
        if (tower.cable && dx >= -14 && dx <= 9 && y - 4 <= 11) { fail(); return; }
      }
      for(const tower of towers) if(!tower.counted && tower.x-scroll<kx-14){tower.counted=true;passed++;}
      if (!endless && scroll >= end - kx) { done = true; api.finish(true, 'Última laje! A rabiola chegou inteira.'); }
    },
    draw(ctx) {
      const sky = '#7fd5d1', brick = '#b15a43', ink = '#283642', white = '#fff2c8', red = '#d95542';
      rect(ctx, sky, 0, 0, 96, 96);
      for (let i = 0; i < 2; i++) {
        const cx = ((145 + i*61 - Math.floor(scroll * 0.18)) % 137 + 137) % 137 - 18, cy = 12 + i * 8;
        rect(ctx, white, cx, cy, 11, 2); rect(ctx, white, cx + 4, cy - 2, 4, 2);
      }
      for(let hx=0;hx<96;hx++) {const h=65+Math.round(7*Math.sin(hx*.08)+3*Math.sin(hx*.19));rect(ctx,'#64b8b0',hx,h,1,96-h);}
      let bx = -Math.floor(scroll * 0.65) % 100 - 25;
      for (let i = 0; bx < 96; i++) {
        const [top, width] = skyline[i % skyline.length];
        rect(ctx, white, bx, top + 2, width, 96 - top);
        rect(ctx, brick, bx - 1, top, width + 2, 3);
        for(let wx=bx+3;wx<bx+width-2;wx+=5){rect(ctx,'#a9b7a0',wx,top+6,3,8);rect(ctx,white,wx+1,top+6,1,8);rect(ctx,brick,wx-1,top+14,5,1);}
        for(let tx=bx;tx<bx+width;tx+=3)rect(ctx,'#ce8060',tx,top,2,1);
        bx += width + 2;
      }
      for (const tower of towers) {
        const ax = Math.round(tower.x - scroll);
        if (ax < -14 || ax > 108) continue;
        rect(ctx, brick, ax - 8, 77, 18, 19);
        rect(ctx, ink, ax, tower.top, 1, 77 - tower.top);
        rect(ctx, ink, ax - 6, tower.top, 13, 2);
        for (let i = -1; i <= 1; i++) rect(ctx, ink, ax + i * 4, tower.top - 2, 1, 4);
        if (tower.cable) {
          // Pássaro ativo em tinta escura; morros e casas são apenas cenário.
          sprite(ctx, ['kk.......kk','.kk.....kk.','..kk...kk..','...kkkkk...','....kkk....'], {k:ink}, ax-5, 7);
        }
      }
      const topY = Math.round(y);
      line(ctx, ink, 0, 82, kx, topY + 4);
      const tail = Math.round(Math.sin(clock * 2 + .65) * 2);
      line(ctx, ink, kx, topY + 4, kx + 8, topY + 8 + tail);
      rect(ctx, red, kx + 4, topY + 5 + tail, 2, 2);
      rect(ctx, red, kx + 8, topY + 7 + tail, 2, 2);
      sprite(ctx, ['....r....','...rrw...','..rrrww..','.rrrrwww.','rrrrrwwww','.wwwwrrr.','..wwwrr..','...wwr...','....w....'], {w:white,r:red}, kx - 4, topY - 4);
    },
    score() { return passed; },
    snapshot() { return {y,passed,done,obstacles:towers.length}; },
    hud() { return 'Obstáculos ' + passed + (endless ? '' : '/' + n) + ' · ' + (vertical < -8 ? 'Subindo' : vertical > 8 ? 'Descendo' : 'Ao vento'); }
  };
}

export const quintal = {goteira, mare, fio, pipa};
