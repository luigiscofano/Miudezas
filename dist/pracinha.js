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

export const pracinha = {peteca, sombra};

