// As quatro cenas usam coordenadas inteiras para conservar o pixel mesmo durante a animação.
const TAMANHO = 96;
const direcoes = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };

function bloco(ctx, x, y, largura, altura, cor) {
  ctx.fillStyle = cor;
  ctx.fillRect(Math.round(x), Math.round(y), largura, altura);
}

function fundo(ctx, cor) {
  bloco(ctx, 0, 0, TAMANHO, TAMANHO, cor);
}

function linha(ctx, inicio, fim, cor, espessura = 1) {
  const dx = fim[0] - inicio[0];
  const dy = fim[1] - inicio[1];
  const passos = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
  for (let i = 0; i <= passos; i++) {
    bloco(ctx, inicio[0] + dx * i / passos, inicio[1] + dy * i / passos, espessura, espessura, cor);
  }
}

function sprite(ctx, x, y, linhas, paleta, escala = 1, espelho = false) {
  linhas.forEach((linhaSprite, py) => {
    for (let px = 0; px < linhaSprite.length; px++) {
      const cor = paleta[linhaSprite[px]];
      if (cor) {
        const coluna = espelho ? linhaSprite.length - px - 1 : px;
        bloco(ctx, x + coluna * escala, y + py * escala, escala, escala, cor);
      }
    }
  });
}

const limitar = (n, min, max) => Math.max(min, Math.min(max, n));
const semAcao = () => {};

// O focinho e os olhos acompanham o mesmo ângulo usado para calcular o bote.
function lagartixa(ctx, x, y, angulo) {
  const pele = '#a5dfab', olho = '#281b48', sombra = '#66b395';
  const u = [Math.cos(angulo), Math.sin(angulo)];
  const v = [-u[1], u[0]];
  const ponto = (a, b) => [x + u[0] * a + v[0] * b, y + u[1] * a + v[1] * b];
  const traco = (a, b, c, d, cor, largura = 1) => linha(ctx, ponto(a,b), ponto(c,d), cor, largura);
  traco(-6, 0, -11, 3, pele, 2);
  traco(-11, 3, -15, 6, pele, 2);
  traco(-15, 6, -19, 5, pele);
  traco(-19, 5, -20, 3, pele);
  for (const lado of [-1, 1]) {
    for (const [a, b] of [[2, 5], [-5, 4]]) {
      traco(a, lado*2, a-1, lado*b, pele, 2);
      traco(a-1, lado*b, a+2, lado*(b+2), pele);
      traco(a+2, lado*(b+2), a+3, lado*(b+1), pele);
    }
  }
  traco(-7, -1, 2, -1, sombra, 4);
  traco(-5, -2, 1, -2, pele, 5);
  traco(1, -2, 6, -2, pele, 5);
  traco(6, -1, 8, -1, pele, 3);
  // Pequenos pixels no dorso mantêm a silhueta e deixam o corpo mais legível.
  traco(-4, -1, 1, -1, '#c9edb6', 1);
  for (const lado of [-1,1]) {
    const [ox, oy] = ponto(5, lado*1.8);
    bloco(ctx, ox, oy, 1, 1, olho);
  }
}

function luz(level, api, options={}) {
  const infinito=options.mode==='endless';
  let erros=0;
  const velocidade=()=>infinito?Math.min(3.8,1.98+capturas*.07):(1.55+.43*level);
  const meta = level + 1;
  const limite = 26 - level;
  const base = [27, 70];
  const pousos = [[62,43], [46,30], [73,54], [54,38], [61,27]];
  let tempo = 0, capturas = 0, indice = 0, mira = 0.24, bote = null, acabou = false;
  const inseto = () => {
    const [x,y] = pousos[indice];
    return [x + 1.8 * Math.sin(tempo*2.6), y + 1.4 * Math.cos(tempo*2.2)];
  };
  const anguloDaPresa = () => {
    const [x,y] = inseto();
    return Math.atan2(y - base[1], x - base[0]);
  };
  const desvio = () => 0.72 * Math.sin(mira);
  const anguloAtual = () => anguloDaPresa() + desvio();
  function terminar() {
    if (acabou) return;
    acabou = true;
    api.finish(!infinito && capturas >= meta, capturas + (capturas === 1 ? ' mosquito capturado.' : ' mosquitos capturados.'));
  }
  function atacar() {
    if (acabou || bote) return;
    const [ix,iy] = inseto();
    const angulo = anguloAtual();
    const distancia = Math.hypot(ix - base[0], iy - base[1]);
    const acerto = Math.abs(desvio()) < (0.19 - level * 0.015);
    bote = { tempo: 0, angulo, acerto, x: base[0] + distancia * Math.cos(angulo), y: base[1] + distancia * Math.sin(angulo) };
    api.tone(acerto ? 605 : 148, 0.10);
  }
  return {
    score(){return capturas;},
    snapshot(){return {capturas,erros,acabou,desvio:desvio(),velocidade:velocidade(),emBote:Boolean(bote)};},
    press: atacar, release: semAcao,
    point(x,y,phase) { if (phase === 'down') atacar(); },
    hud() { if(infinito)return capturas+' mosquitos · '+(3-erros)+' erros restantes'; return capturas + '/' + meta + ' mosquitos · ' + Math.max(0, Math.ceil(limite - tempo)) + ' s'; },
    update(dt) {
      if (acabou) return;
      tempo += dt;
      if (bote) {
        bote.tempo += dt;
        if (bote.tempo >= 0.44) {
          if (bote.acerto) {
            capturas++;
            indice = (indice+1) % pousos.length;
            if (!infinito && capturas === meta) { terminar(); return; }
          }
          if(infinito&&!bote.acerto&&++erros===3){terminar();return;}
          bote = null;
          mira = -1.3;
        }
      } else {
        mira += dt * velocidade();
      }
      if (!infinito && tempo >= limite) terminar();
    },
    draw(ctx) {
      fundo(ctx, '#33245e');
      // Relevo discreto da parede, sem interferir com a mira ou os mosquitos.
      linha(ctx,[0,34],[17,34],'#3a2a65');
      linha(ctx,[9,34],[9,43],'#3a2a65');
      linha(ctx,[80,66],[95,66],'#3a2a65');
      linha(ctx,[88,66],[88,77],'#3a2a65');
      bloco(ctx,0,91,96,5,'#2a204d');
      bloco(ctx,0,90,96,1,'#4b386c');
      bloco(ctx,69,12,17,11,'#44345f');
      bloco(ctx,71,10,13,15,'#44345f');
      bloco(ctx,72,13,11,9,'#61506b');
      linha(ctx,[0,22],[4,19],'#4d3976');
      linha(ctx,[4,19],[7,19],'#4d3976');
      linha(ctx,[87,85],[91,81],'#4d3976');
      linha(ctx,[91,81],[95,81],'#4d3976');
      const tempoRestante = infinito?Infinity:limite-tempo;
      const apagada = (tempoRestante < 2.2 && tempoRestante > 1.98) || (tempoRestante < 1.02 && tempoRestante > 0.80);
      const brilho = apagada ? '#847e83' : '#ffe682';
      linha(ctx,[78,0],[78,7],'#161a33',2);
      linha(ctx,[78,7],[76,10],'#161a33',2);
      bloco(ctx,74,10,7,3,'#181930');
      bloco(ctx,75,13,5,2,brilho); bloco(ctx,73,15,9,5,brilho); bloco(ctx,75,20,5,1,brilho);
      if (!apagada) { bloco(ctx,69,16,2,1,'#bbad7c'); bloco(ctx,84,16,2,1,'#bbad7c'); }
      if (!bote || !bote.acerto || bote.tempo < 0.15) {
        const [x,y] = inseto();
        const asas = Math.floor(tempo * 12) % 2;
        bloco(ctx,x,y,2,2,'#f3efc2');
        bloco(ctx,x-2,y-asas,2,1,'#e6d4c8');
        bloco(ctx,x+2,y-1+asas,2,1,'#e6d4c8');
        bloco(ctx,x+1,y+2,1,1,'#c4b0c6');
      }
      if (bote) {
        const frac = Math.min(bote.tempo/0.15, Math.max(0, (0.44-bote.tempo)/0.23), 1);
        lagartixa(ctx, base[0]+(bote.x-base[0])*frac, base[1]+(bote.y-base[1])*frac, bote.angulo);
      } else {
        lagartixa(ctx, base[0],base[1],anguloAtual());
      }
    }
  };
}

const terrenos = [
  { alvo:[77,20], pedras:[[48,48,10,8]] },
  { alvo:[78,19], pedras:[[12,48,13,12],[49,43,13,10]] },
  { alvo:[78,18], pedras:[[10,43,15,12],[72,51,15,12]] }
];
const desenhoBolinha = ['..bbb..','.bbwwb.','bbbwwbb','bbwwbbb','bwwbbbb','.bbbbb.','..bbb..'];

// Gerador determinístico: o mesmo código de semente reconstrói a tentativa.
function aleatorioComSemente(seed) {
  let valor = Number(seed) >>> 0;
  return () => { valor = (Math.imul(valor,1664525)+1013904223) >>> 0; return valor/4294967296; };
}

// O certificado usa os controles públicos e a física real, não apenas conectividade.
export function validarTerrenoGude(terreno) {
  if (!terreno.solucao || terreno.solucao.length > 3) return false;
  // Puxado tem duas pedras de 15×12: a área bloqueada não deve ficar menor.
  if(terreno.pedras.length<2 || terreno.pedras.reduce((s,[,,w,h])=>s+w*h,0)<360)return false;
  const [ix,iy]=terreno.inicio || [16,80];
  const dx=terreno.alvo[0]-ix,dy=terreno.alvo[1]-iy,norma=Math.hypot(dx,dy);
  // Rejeita mapas resolvidos apontando diretamente ao buraco, inclusive ricochetes.
  for(let forca=3;forca<=94;forca++){
    let venceu=false;const jogo=gude(3,{tone(){},finish(ok){venceu=ok;}},{terrenoValidado:terreno});
    jogo.point(ix,iy,'down');jogo.point(ix-dx/norma*forca/3.6,iy-dy/norma*forca/3.6,'up');
    for(let q=0;q<600&&jogo.moving;q++)jogo.update(1/60);
    if(venceu)return false;
  }
  for (const dt of [1/30,1/60,1/120]) {
    for (let combinacao=0; combinacao<8; combinacao++) {
      let venceu=false;
      const jogo=gude(1,{tone(){},finish(ok){venceu=ok;}},{terrenoValidado:terreno});
      for (const [indice,passo] of terreno.solucao.entries()) {
        jogo.press(passo.direcao);
        // Tolerância de 15 ms por gesto; evita certificados sem margem de execução.
        jogo.update(passo.duracao + ((combinacao>>indice)&1 ? .015 : -.015));
        jogo.release(passo.direcao);
        for(let quadro=0;quadro<600 && jogo.moving;quadro++) jogo.update(dt);
      }
      if(!venceu) return false;
      // Repete pelo arrasto real: erros de 0,25 pixel lógico em ambos os eixos.
      let toqueVenceu=false;
      const toque=gude(3,{tone(){},finish(ok){toqueVenceu=ok;}},{terrenoValidado:terreno});
      for(const [indice,passo] of terreno.solucao.entries()){
        const {x,y}=toque.snapshot(),[dx,dy]=direcoes[passo.direcao];
        const distancia=(5+68*passo.duracao)/3.6;
        const erro=((combinacao>>indice)&1)?.25:-.25;
        const px=x-dx*distancia+erro,py=y-dy*distancia-erro;
        if(px<0||px>96||py<0||py>96)return false;
        toque.point(x,y,'down');toque.point(px,py,'up');
        for(let q=0;q<600&&toque.moving;q++)toque.update(dt);
      }
      if(!toqueVenceu)return false;
    }
  }
  return true;
}

// Rotação/reflexão transforma também obstáculos e certificado, não só a decoração.
function orientarTerrenoGude(pontos,pedras,orientacao,seed,familia) {
  function transformar([x,y]) {
    if(orientacao>=4)x=96-x;
    for(let n=0;n<orientacao%4;n++)[x,y]=[96-y,x];
    return [x,y];
  }
  const caminho=pontos.map(transformar);
  const solucao=caminho.slice(1).map(([x,y],i)=>{
    const dx=x-caminho[i][0],dy=y-caminho[i][1];
    return {direcao:dx>0?'right':dx<0?'left':dy>0?'down':'up',duracao:(Math.hypot(dx,dy)-5)/68};
  });
  const transformadas=pedras.map(([x,y,w,h])=>{
    const cantos=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(transformar);
    const xs=cantos.map(p=>p[0]),ys=cantos.map(p=>p[1]);
    return [Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)];
  });
  return {inicio:caminho[0],alvo:caminho.at(-1),pedras:transformadas,solucao,
    semente:Number(seed)>>>0,familia,orientacao};
}

export function criarTerrenoGude(seed=1) {
  // Avalanche da semente: sementes vizinhas não escolhem sempre a mesma região.
  let mistura=(Number(seed)>>>0)^0x9e3779b9;
  mistura=Math.imul(mistura^(mistura>>>16),0x21f0aaad);
  mistura=Math.imul(mistura^(mistura>>>15),0x735a2d97);
  const random=aleatorioComSemente(mistura^(mistura>>>15));
  const inteiro=(a,b)=>a+Math.floor(random()*(b-a+1));
  const familia=inteiro(0,1)===0?'travessia':'retorno',orientacao=inteiro(0,7);
  for(let tentativa=0;tentativa<32;tentativa++) {
    const sx=inteiro(18,25),sy=inteiro(70,78),ty=inteiro(25,34);
    let pontos,pedras;
    if(familia==='travessia') {
      const virada=inteiro(40,50),final=inteiro(75,82);
      pontos=[[sx,sy],[virada,sy],[virada,ty],[final,ty]];
      pedras=[[virada+8,ty+11,inteiro(14,18),inteiro(15,19)],
        [inteiro(7,12),inteiro(30,40),14,13]];
    }else{
      const virada=inteiro(73,80),final=inteiro(24,37);
      pontos=[[sx,sy],[virada,sy],[virada,ty],[final,ty]];
      // A parede central exige contornar pelo lado oposto e voltar ao alvo.
      pedras=[[sx-5,ty+11,virada-sx-9,sy-ty-23],[7,8,12,13]];
    }
    // Fragmenta uma barreira com diferentes volumes, mantendo o corredor certificado.
    const quantidade=inteiro(2,4);
    while(pedras.length<quantidade){
      const [x,y,w,h]=pedras.shift();
      if(w>=h)pedras.push([x,y,Math.floor(w/2),h],[x+Math.floor(w/2)+1,y,w-Math.floor(w/2)-1,h]);
      else pedras.push([x,y,w,Math.floor(h/2)],[x,y+Math.floor(h/2)+1,w,h-Math.floor(h/2)-1]);
    }
    const terreno=orientarTerrenoGude(pontos,pedras,orientacao,seed,familia);
    if(validarTerrenoGude(terreno))return terreno;
  }
  // Saída conhecida ainda é certificada, inclusive após orientar seus controles.
  const seguro=orientarTerrenoGude([[20,76],[44,76],[44,28],[80,28]],
    [[52,40,16,18],[10,36,14,13]],orientacao,seed,'seguranca');
  if(!validarTerrenoGude(seguro))throw new Error('O percurso de segurança não passou pela física do jogo.');
  return seguro;
}

function gude(level, api, options={}) {
  const terreno = options.terrenoValidado || (options.mode==='generated' ? criarTerrenoGude(options.seed) : terrenos[level-1]);
  const inicio = terreno.inicio || [16,80], alvo = terreno.alvo;
  let x = inicio[0], y = inicio[1], jogadas = 0, acabou = false;
  let tecla = null, carga = 0, arrasto = null, tiro = null;
  const alcance = () => Math.min(94, 5 + 68*carga);
  function soltar(dx,dy,distancia) {
    if (acabou || tiro || distancia < 1) return;
    const norma = Math.hypot(dx,dy);
    if (norma < 0.01) return;
    const total = limitar(distancia,3,94);
    tiro = { dx: dx/norma, dy: dy/norma, falta: total, total, rodado: 0 };
    jogadas++;
    api.tone(380 + total * 2,0.055);
  }
  function resultado(venceu) {
    acabou = true; tiro = null;
    api.finish(venceu, venceu ? 'No buraco em ' + jogadas + (jogadas===1?' peteleco!':' petelecos!') : 'A bolinha ficou fora do buraco.');
  }
  function bloqueia(px,py) {
    if (px < 3 || px > 92 || py < 3 || py > 92) return true;
    return terreno.pedras.some(([a,b,w,h]) => px > a-2 && px < a+w+2 && py > b-2 && py < b+h+2);
  }
  function andar(passo) {
    const ox = x, oy = y;
    if (bloqueia(x+tiro.dx*passo,y)) tiro.dx = -tiro.dx;
    x += tiro.dx*passo;
    if (bloqueia(x,y+tiro.dy*passo)) tiro.dy = -tiro.dy;
    y += tiro.dy*passo;
    if (bloqueia(x,y)) { x=ox; y=oy; }
  }
  return {
    get moving(){return Boolean(tiro);},
    snapshot(){return {x,y,jogadas,acabou,emMovimento:Boolean(tiro),terreno:structuredClone(terreno)};},
    press(dir) {
      if (!direcoes[dir] || acabou || tiro || arrasto || tecla) return;
      tecla = dir; carga = 0;
    },
    cancelInput() { tecla=null; arrasto=null; carga=0; },
    release(dir) {
      if (dir !== tecla || !tecla) return;
      const [dx,dy] = direcoes[tecla]; tecla = null; soltar(dx,dy,alcance()); carga=0;
    },
    point(px,py,phase) {
      if (acabou || tiro || tecla) return;
      if (phase==='down' && Math.hypot(px-x,py-y)<13) arrasto = { sx:px,sy:py,px,py };
      if (!arrasto) return;
      arrasto.px=px; arrasto.py=py;
      if (phase==='up') {
        const dx = arrasto.sx-px, dy = arrasto.sy-py;
        arrasto=null;
        if (Math.hypot(dx,dy)>1) soltar(dx,dy,Math.hypot(dx,dy)*3.6);
      } else if (phase==='cancel') arrasto=null;
    },
    hud() {
      const n = 3-jogadas;
      return tecla || arrasto ? 'Solte para dar o peteleco' : n + (n===1?' peteleco restante':' petelecos restantes');
    },
    update(dt) {
      if (acabou) return;
      if (tecla) carga+=dt;
      if (!tiro) return;
      let viagem = Math.min(tiro.falta, dt*(31+tiro.falta/tiro.total*100));
      while (viagem > 0.0001) {
        const passo=Math.min(0.75,viagem);
        andar(passo); tiro.falta-=passo; tiro.rodado+=passo; viagem-=passo;
        if (Math.hypot(x-alvo[0], y-alvo[1])<=4.9) { resultado(true); return; }
      }
      if (tiro.falta <= 0.001) {
        tiro=null;
        if (jogadas===3) resultado(false);
      }
    },
    draw(ctx) {
      fundo(ctx,'#ca733d');
      // Grãos nas bordas sugerem terra batida; não representam obstáculos.
      for (const [gx,gy] of [[7,7],[21,10],[55,5],[88,28],[6,63],[19,89],[61,88],[87,76],[35,7]]) {
        bloco(ctx,gx,gy,2,1,'#b76235');
        bloco(ctx,gx+2,gy+2,1,1,'#df9553');
      }
      bloco(ctx,8,48,1,1,'#aa522f'); bloco(ctx,74,79,1,1,'#aa522f');
      sprite(ctx,1,15,['.g...g','..g.g.','..gg..','...g..'],{g:'#858041'});
      const [a,b]=alvo;
      sprite(ctx,a-5,b-4,['...rrrr...','.rddddddr.','rddddddddr','dddddddddd','dddddddddd','.dddddddd.','..dddddd..','...rrrr...'],{r:'#ab502c',d:'#553022'});
      for (const [px,py,w,h] of terreno.pedras) {
        bloco(ctx,px+2,py+3,w,h-2,'#aa552f');
        bloco(ctx,px+2,py,w-4,h,'#8d8170');
        bloco(ctx,px,py+2,w,h-4,'#8d8170');
        bloco(ctx,px+w-4,py+2,2,2,'#685d55');
        bloco(ctx,px+3,py+1,Math.max(2,w-7),1,'#b4a48a');
        bloco(ctx,px+1,py+3,2,2,'#a69a83');
        bloco(ctx,px+3,py+h-2,Math.max(2,w-6),1,'#70645a');
      }
      let vec,dist;
      if (tecla) { vec=direcoes[tecla]; dist=alcance(); }
      if (arrasto) {
        const dx=arrasto.sx-arrasto.px,dy=arrasto.sy-arrasto.py;
        const norma=Math.hypot(dx,dy);
        if (norma>0.5) { vec=[dx/norma,dy/norma]; dist=limitar(norma*3.6,3,94); }
      }
      if (vec) {
        // A marca mostra o alcance em linha reta. As pedras podem mudar o trajeto.
        for (let r=7;r<dist;r+=7) {
          const px=x+vec[0]*r,py=y+vec[1]*r;
          if (bloqueia(px,py)) break;
          bloco(ctx,px,py,1,1,'#f2bb72');
        }
        const px=x+vec[0]*dist,py=y+vec[1]*dist;
        if (!bloqueia(px,py)) { bloco(ctx,px-1,py,3,1,'#fff0c3'); bloco(ctx,px,py-1,1,3,'#fff0c3'); }
      }
      bloco(ctx,x-2,y+3,6,2,'#a95130');
      sprite(ctx,x-3,y-3,desenhoBolinha,{b:'#173a73',w:'#fff4cb'},1,Boolean(tiro && Math.floor(tiro.rodado/5)%2));
      bloco(ctx,x-1,y-2,1,1,'#ffffff');
      bloco(ctx,x+2,y+1,1,1,'#397ca5');
    }
  };
}

const corpoVaga = [".....k.k..","...ww.k...","..wwwgkk..","llgggggkk.","llggggg...","..k..k...."];

function pisca(level,api,options={}) {
  const infinito=options.mode==='endless';
  let concluidas=0;
  const meta=level+2, duracao=0.58-0.055*level;
  const random=options.seed===undefined?Math.random:aleatorioComSemente(options.seed);
  const sorteio=()=>random()<0.5?'left':'right';
  const sequencia=[sorteio()];
  let estado='preparo', espera=0.75, mostrado=0, resposta=0, luzAcesa=null, pulso=0, tempo=0;
  function nota(dir,segundos){api.tone(dir==='left'?392:587,segundos);}
  function acender(dir){
    luzAcesa=dir; pulso=duracao;
    nota(dir,duracao*0.8);
  }
  function responder(dir){
    if(estado!=='resposta' || (dir!=='left'&&dir!=='right')) return;
    luzAcesa=dir; pulso=0.2;
    if(dir!==sequencia[resposta]){
      estado='perdeu'; espera=0.4;
      api.tone(155,0.20); return;
    }
    nota(dir,0.12); resposta++;
    if(resposta===sequencia.length){
      concluidas=sequencia.length;
      estado=!infinito&&sequencia.length===meta?'ganhou':'ampliar';
      espera=0.52;
    }
  }
  return {
    score(){return concluidas;},
    snapshot(){return {estado,sequencia:[...sequencia],concluidas};},
    press:responder,release:semAcao,
    point(x,y,phase){if(phase==='down') responder(x<48?'left':'right');},
    hud() {
      if(estado==='resposta') return 'Sua vez · '+resposta+'/'+sequencia.length;
      if(estado==='ampliar'||estado==='ganhou')return 'Acertou! · '+sequencia.length+(infinito?' piscadas':'/'+meta);
      if(estado==='perdeu')return 'Outra ordem…';
      return 'Observe · Sequência '+sequencia.length+(infinito?'':'/'+meta);
    },
    update(dt){
      if(estado==='fim')return;
      tempo+=dt;
      if(pulso>0){pulso-=dt;if(pulso<=0)luzAcesa=null;}
      if(estado==='resposta')return;
      espera-=dt;
      if(espera>0)return;
      if(estado==='ganhou'||estado==='perdeu'){
        const ok=estado==='ganhou';
        estado='fim';
        api.finish(ok,ok?'Repetiu as '+meta+' piscadas!':'Completou '+concluidas+' piscadas na maior sequência.');return;
      }
      if(estado==='ampliar'){
        sequencia.push(sorteio()); mostrado=0; resposta=0; estado='preparo'; espera=0.48; return;
      }
      if(mostrado<sequencia.length){
        estado='mostrando'; acender(sequencia[mostrado]); mostrado++;
        espera=duracao+0.24;return;
      }
      estado='resposta'; resposta=0; luzAcesa=null; pulso=0;
    },
    draw(ctx){
      fundo(ctx,'#0b3439');
      // Capim baixo em três grupos: nada disputa atenção com as piscadas.
      bloco(ctx,0,93,96,3,'#173e38');
      for(const [x,y] of [[7,88],[20,91],[44,90],[76,89],[90,86]]) {
        linha(ctx,[x,y+5],[x-2,y-3],'#315f47');
        linha(ctx,[x,y+5],[x+3,y-1],'#315f47');
        linha(ctx,[x,y+5],[x,y-5],'#49764d');
      }
      sprite(ctx,0,86,['g.....','g....g','.g..g.','.g.gg.','..gg..','..gg..','..gg..','..gg..','..gg..','..gg..'],{g:'#48764d'});
      sprite(ctx,89,89,['...g..','...g.g','..ggg.','..gg..','.gg...','.gg...','.gg...'],{g:'#48764d'});
      for(const [dir,x] of [['left',16],['right',62]]){
        const ligado=luzAcesa===dir;
        const y=Math.round(43+Math.sin(tempo*1.7+(dir==='left'?0:1.8))*1.2);
        sprite(ctx,x,y,corpoVaga,{g:'#7caa58',w:'#a1d8ab',k:'#1c493c',l:ligado?'#ffe466':'#739e55'},2,dir==='right');
        if(ligado){
          const ponta=dir==='left'?x+1:x+20, sinal=dir==='left'?-1:1;
          linha(ctx,[ponta+3*sinal,y+5],[ponta+4*sinal,y+4],'#ffdf60');
          bloco(ctx,ponta+6*sinal,y+9,2,1,'#ffdf60');
          linha(ctx,[ponta+3*sinal,y+12],[ponta+4*sinal,y+13],'#ffdf60');
        }
      }
    }
  };
}

export const varanda = {luz, gude, pisca};

