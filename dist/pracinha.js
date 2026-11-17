// Quatro brincadeiras de uma ação, desenhadas na grade lógica de 96 × 96.
const limitar = (valor, minimo, maximo) => Math.max(minimo, Math.min(maximo, valor));

function bloco(ctx, cor, x, y, largura, altura) {
  ctx.fillStyle = cor;
  ctx.fillRect(Math.round(x), Math.round(y), largura, altura);
}

function sprite(ctx, linhas, cores, x, y, espelhar = false) {
  linhas.forEach((linha, dy) => [...linha].forEach((pixel, dx) => {
    if (cores[pixel]) bloco(ctx, cores[pixel], x + (espelhar ? linha.length - 1 - dx : dx), y + dy, 1, 1);
  }));
}

function entradaHorizontal() {
  const teclas = new Set();
  return {
    press(direcao) { teclas.add(direcao); },
    release(direcao) { teclas.delete(direcao); },
    cancelInput() { teclas.clear(); },
    direcao() { return Number(teclas.has('right')) - Number(teclas.has('left')); }
  };
}

const penas = [
  '.....cc......', '....cccc.....', '.cc.cccc..cc.',
  'cccccccc.cccc', '.ccccccc.ccc.', '..cccccccc...',
  '...cccccc....', '....cccc.....', '....cccc.....',
  '...rrrrrr....', '..rrrrrrrr...', '..rrrrrrrr...', '...rrrrrr....'
];
const mao = [
  '.............mm........', '..mm..mm....mmmm.......',
  '.mmmmmmmmmmmmmmmm......', '..mmmmmmmmmmmmmmmm.....',
  '...mmmmmmmmmmmmmmmm....', '....mmmmmmmmmmmmmmmm...',
  '......mmmmmmmmmmmmmmm..', '.............mmmmmmmmm.',
  '..............mmmmmmmmm', '...............mmmmmmmm'
];

function peteca(nivel, api) {
  const gravidade = [58, 66, 74][nivel - 1];
  const inicioAcerto = [65, 68, 71][nivel - 1];
  let y = 27, velocidade = 0, pontos = 0, gesto = 0, espera = 0, acabou = false;
  return {
    press(direcao) {
      if (acabou || espera || gesto > 0 || !['act', 'up'].includes(direcao)) return;
      gesto = 0.18;
      // Só a descida perto da palma aceita uma rebatida; segurar não repete.
      if (velocidade > 0 && y >= inicioAcerto && y <= 82) {
        pontos++;
        velocidade = -Math.sqrt(2 * gravidade * (y - 23));
        api.tone(340 + pontos * 32, 0.06);
        if (pontos === 10) espera = 0.65;
      }
    },
    release() {},
    update(dt) {
      if (acabou) return;
      gesto = Math.max(0, gesto - dt);
      if (espera > 0) {
        espera = Math.max(0, espera - dt);
        if (!espera) { acabou = true; api.finish(true, 'Dez rebatidas! A peteca ficou no ar.'); }
        return;
      }
      y += velocidade * dt + gravidade * dt * dt / 2;
      velocidade += gravidade * dt;
      if (y >= 86) { acabou = true; api.finish(false, 'A peteca caiu. Rebatidas: ' + pontos + '/10.'); }
    },
    draw(ctx) {
      bloco(ctx, '#94cdea', 0, 0, 96, 96);
      bloco(ctx, '#c5664d', 0, 89, 96, 7);
      sprite(ctx, penas, {c:'#fff0cc', r:'#a52f32'}, 40, y - 12);
      sprite(ctx, mao, {m:'#a65f38'}, 39, gesto > 0 ? 78 : 81);
      bloco(ctx, '#a65f38', 57, 87, 10, 2);
      if (gesto > 0) {
        bloco(ctx, '#fff0cc', 34, 76, 2, 1);
        bloco(ctx, '#fff0cc', 51, 73, 1, 2);
      }
    },
    hud() { return 'Rebatidas ' + pontos + '/10 · ↑ na descida'; }
  };
}

const gatoEmPe = [
  '.g.....g.', '.gg...gg.', '.ggggggg.', 'ggggggggg',
  '.ggggggg.', '.glllllg.', '.ggggggg.', '.ggggggg.',
  '.glllllg.', '.ggggggg.', '..ggggg..', '..g...g..',
  '..g......', '.gg......', 'gg.......'
];
const gatoDeitado = [
  '.......g...g.', '.......ggggg.', '..ggggggggggg',
  '.gglgglgggggg', 'ggglgglggggg.', '.gggggggggg..'
];

function sombra(nivel, api) {
  const entrada = entradaHorizontal();
  const largura = [34, 28, 24][nivel - 1];
  const velocidade = [7, 10, 13][nivel - 1];
  let centro = 68, rumo = -1, gatoX = 68, tempo = 0, sono = 0, acabou = false;
  return {
    ...entrada,
    update(dt) {
      if (acabou) return;
      if (sono > 0) {
        sono -= dt;
        if (sono <= 0) { acabou = true; api.finish(true, 'Vinte segundos de sombra. Hora da soneca.'); }
        return;
      }
      // O contorno muda de direção nas bordas; a velocidade do gato permite acompanhá-lo.
      const passo = Math.min(dt, 20 - tempo);
      tempo += passo;
      centro += rumo * velocidade * passo;
      if (centro < 20) { centro = 40 - centro; rumo = 1; }
      if (centro > 76) { centro = 152 - centro; rumo = -1; }
      gatoX = limitar(gatoX + entrada.direcao() * 32 * passo, 5, 91);
      if (Math.abs(gatoX - centro) + 4 > largura / 2) {
        acabou = true; api.tone(160, 0.12); api.finish(false, 'Miau! O gatinho saiu da sombra.'); return;
      }
      if (tempo >= 20) { sono = 1; entrada.cancelInput(); api.tone(390, 0.1); }
    },
    draw(ctx) {
      bloco(ctx, '#f5b08b', 0, 0, 96, 96);
      const esquerda = Math.round(centro - largura / 2);
      bloco(ctx, '#6b587e', esquerda, 0, largura, 96);
      bloco(ctx, '#f5b08b', esquerda, 0, 2, 20);
      bloco(ctx, '#6b587e', esquerda - 1, 23, 1, 22);
      const cores = {g:'#efa32e', l:'#bd6127'};
      sprite(ctx, sono > 0 ? gatoDeitado : gatoEmPe, cores, gatoX - (sono > 0 ? 6 : 4), sono > 0 ? 66 : 58);
      if (sono > 0) {
        bloco(ctx, '#fff0cc', gatoX + 9, 59, 3, 1);
        bloco(ctx, '#fff0cc', gatoX + 10, 60, 1, 1);
        bloco(ctx, '#fff0cc', gatoX + 9, 61, 3, 1);
      }
    },
    hud() { return sono > 0 ? 'Zzz...' : 'Sombra · ' + Math.max(0, Math.ceil(20 - tempo)) + ' s · ← →'; }
  };
}

const peixe = ['...cc......', '...c.c.....', 'p..ppppp...', 'ppppppppp..', 'pppppppppp.', 'ppppppppp..', 'p..ppppp...'];

function pescaria(nivel, api) {
  const velocidade = [10, 14, 18][nivel - 1];
  const tolerancia = [6, 5, 4][nivel - 1];
  const peixes = [{x:25, rumo:1, cor:'#f0cc42'}, {x:70, rumo:-1, cor:'#ee913b'}];
  let y = 45, fase = 'espera', preso = null, pontos = 0, acabou = false;
  return {
    press(direcao) {
      if (!acabou && fase === 'espera' && ['act', 'down'].includes(direcao)) fase = 'descendo';
    },
    release() {},
    update(dt) {
      if (acabou) return;
      peixes.forEach(p => {
        if (p === preso) return;
        p.x += p.rumo * velocidade * dt;
        if (p.x < 16) { p.x = 32 - p.x; p.rumo = 1; }
        if (p.x > 80) { p.x = 160 - p.x; p.rumo = -1; }
      });
      if (fase === 'descendo') {
        y = Math.min(76, y + 42 * dt);
        // O ímã só coleta ao alcançar a altura da argola. Ele volta mesmo se errar.
        if (y >= 76) {
          preso = peixes.find(p => Math.abs(p.x - 48) <= tolerancia) || null;
          fase = 'subindo';
          if (preso) api.tone(490, 0.08);
        }
      } else if (fase === 'subindo') {
        y = Math.max(45, y - 36 * dt);
        if (y <= 45) {
          if (preso) {
            pontos++; preso.x = pontos % 2 ? 16 : 80; preso.rumo = pontos % 2 ? 1 : -1; preso = null;
            if (pontos === 3) { acabou = true; api.finish(true, 'Três peixinhos pescados!'); return; }
          }
          fase = 'espera';
        }
      }
    },
    draw(ctx) {
      bloco(ctx, '#b8d8b6', 0, 0, 96, 96);
      bloco(ctx, '#fff0cc', 0, 91, 96, 5);
      bloco(ctx, '#3553a6', 7, 70, 82, 17);
      bloco(ctx, '#3553a6', 10, 87, 76, 4);
      bloco(ctx, '#253568', 12, 74, 72, 12);
      peixes.forEach(p => {
        if (p !== preso) sprite(ctx, peixe, {p:p.cor, c:'#fff0cc'}, p.x - 4, 76, p.rumo < 0);
      });
      bloco(ctx, '#383331', 48, 0, 1, Math.round(y - 8));
      sprite(ctx, ['..rrrrr..','.rrrrrrr.','rrr...rrr','rr.....rr','rr.....rr','cc.....cc'], {r:'#b7453e',c:'#fff0cc'}, 44, y - 8);
      if (preso) sprite(ctx, peixe, {p:preso.cor, c:'#fff0cc'}, 44, y, preso.rumo < 0);
    },
    hud() { return 'Peixes ' + pontos + '/3 · ' + (fase === 'espera' ? '↓ para pescar' : fase === 'descendo' ? 'Descendo...' : preso ? 'Pegou!' : 'Tente outra vez'); }
  };
}

const piaoDesenho = [
  '.....mm....', '.....mm....', '...oooooo..', '..oocccooo.',
  '.oocccooooo', '.ooccoooooo', '.ooocccooo.', '..ooooccco.',
  '..occccco..', '...ooooo...', '....ooo....', '.....m.....'
];

function piao(nivel, api) {
  const entrada = entradaHorizontal();
  const forca = [10, 14, 18][nivel - 1];
  let x = 48, tempo = 0, acabou = false;
  return {
    ...entrada,
    update(dt) {
      if (acabou) return;
      const passo = Math.min(dt, 20 - tempo);
      tempo += passo;
      // Uma deriva contínua pede pequenos ajustes; soltar interrompe a correção.
      const deriva = forca * (0.45 + Math.sin(tempo * 0.55 + 0.7));
      x += (deriva + entrada.direcao() * 35) * passo;
      if (Math.abs(x - 48) > 21) { acabou = true; api.finish(false, 'O pião escapou do círculo. Tente de novo.'); }
      else if (tempo >= 20) { acabou = true; api.tone(440, 0.1); api.finish(true, 'Vinte segundos! O pião ficou no círculo.'); }
    },
    draw(ctx) {
      bloco(ctx, '#a54a38', 0, 0, 96, 96);
      // Pontos inteiros deixam o círculo de giz ligeiramente irregular.
      for (let i = 0; i < 140; i++) {
        if (i >= 85 && i <= 89) continue;
        const angulo = i / 140 * Math.PI * 2;
        bloco(ctx, '#fff0cc', 48 + Math.cos(angulo) * 25, 57 + Math.sin(angulo) * 23, 1, 1);
      }
      const oscilar = Math.floor(tempo * 10) % 2;
      sprite(ctx, piaoDesenho, {m:'#572d21',o:'#cf902b',c:'#fff0cc'}, x - 5, 46, oscilar === 1);
      bloco(ctx, '#fff0cc', x - 9, 51 + oscilar, 1, 2);
      bloco(ctx, '#fff0cc', x + 8, 54 - oscilar, 1, 2);
    },
    hud() { return 'No círculo · ' + Math.max(0, Math.ceil(20 - tempo)) + ' s · ← →'; }
  };
}

export const pracinha = {peteca, sombra, pescaria, piao};
