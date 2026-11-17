import {test} from 'node:test';
import assert from 'node:assert/strict';
import {esquina, gerarRastro, validarRastro, buscarAtalhoRastro} from '../dist/esquina.js';

function criar(tipo, nivel = 1, options = {}) {
  const resultados = [];
  return {jogo: esquina[tipo](nivel, {finish: (...r) => resultados.push(r)}, options), resultados};
}
function recolherProntos(jogo) {
  for (const [lado, alimento] of jogo.snapshot().alimentos.entries()) {
    if (alimento.estado === 1 && !alimento.reposicao) {
      jogo.selectTool(alimento.tipo === 'ovo' ? 'espatula' : 'pinca');
      jogo.press(lado ? 'right' : 'left');
    }
  }
}
for (const nivel of [1, 2, 3]) {
  test(`Pão ${nivel}: metas separadas, vitória imediata e fim único`, () => {
    const {jogo, resultados} = criar('pao', nivel);
    for (let t = 0; t < 60 && !resultados.length; t += 0.02) {
      jogo.update(0.02); recolherProntos(jogo);
      const s = jogo.snapshot();
      assert.equal(s.fim, s.entregues.ovo >= s.metas.ovo && s.entregues.pao >= s.metas.pao);
    }
    assert.equal(resultados.length, 1); assert.equal(resultados[0][0], true);
    const fim = jogo.snapshot(); jogo.update(100); recolherProntos(jogo);
    assert.deepEqual(jogo.snapshot(), fim); assert.equal(resultados.length, 1);
  });
}
test('Pão Sem Parar atravessa 20 minutos sem meta/cronômetro e perde no terceiro erro', () => {
  const {jogo, resultados} = criar('pao', 1, {mode: 'endless'});
  for (let t = 0; t < 1200; t += 0.05) { jogo.update(0.05); recolherProntos(jogo); }
  assert.equal(resultados.length, 0); assert.ok(jogo.score() > 200);
  assert.equal(jogo.snapshot().metas, null);
  jogo.update(100);
  assert.equal(resultados.length, 1); assert.equal(resultados[0][0], false);
  assert.equal(jogo.snapshot().erros, 3);
});
test('Rastro: 1000 sementes determinísticas completadas pelos controles reais', () => {
  const mapas = new Set();
  for (let seed = 0; seed < 1000; seed++) {
    const fase = gerarRastro(seed);
    assert.deepEqual(fase, gerarRastro(seed)); assert.ok(validarRastro(fase.mapa, fase.solucao));
    mapas.add(fase.mapa.join(''));
    const {jogo, resultados} = criar('rastro', 1, {mode: 'generated', seed});
    for (const dir of fase.solucao) { jogo.press(dir); jogo.release(dir); }
    assert.deepEqual(resultados, [[true, 'Três folhas e um cantinho no vaso.']]);
    assert.equal(jogo.snapshot().folhas, 3);
    assert.equal(jogo.snapshot().caminho.length, fase.solucao.length + 1);
    assert.deepEqual(criar('rastro', 1, {mode: 'generated', seed}).jogo.snapshot().mapa, fase.mapa);
  }
  assert.ok(mapas.size > 950);
});
test('Rastro: validação rejeita caminho vazio, cruzamento e saída dos limites', () => {
  const fase = gerarRastro(5);
  assert.equal(validarRastro(fase.mapa, []), false);
  assert.equal(validarRastro(fase.mapa, [...fase.solucao, 'left']), false);
  assert.equal(validarRastro(fase.mapa, Array(40).fill('left')), false);
});
test('Rastro: mapas autorais preservados e sprites desenháveis', () => {
  const ctx = {fillRect(){},save(){},restore(){},translate(){},scale(){}};
  for (const nivel of [1,2,3]) {
    const {jogo} = criar('rastro', nivel);
    assert.equal(jogo.snapshot().mapa.length, nivel + 4);
    jogo.draw(ctx);
    assert.equal(jogo.snapshot().solucao, null);
  }
});

function centroRastro(jogo, indice) {
  const lado = jogo.snapshot().mapa.length, tamanho = Math.floor(94 / lado), margem = Math.floor((96 - tamanho * lado) / 2);
  return [margem + (indice % lado + 0.5) * tamanho, margem + (Math.floor(indice / lado) + 0.5) * tamanho];
}
function resolverAutoral(mapa) {
  const lado=mapa.length, casas=mapa.join(''), usadas=new Set(), comandos=[];
  const direcoes={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]};
  function visitar(pos, folhas) {
    if(casas[pos]==='P') return folhas===3;
    usadas.add(pos);
    for(const [dir,[dx,dy]] of Object.entries(direcoes)) {
      const x=pos%lado+dx,y=Math.floor(pos/lado)+dy,next=y*lado+x;
      if(x<0||y<0||x>=lado||y>=lado||usadas.has(next)||casas[next]==='#'||(casas[next]==='P'&&folhas<3))continue;
      comandos.push(dir);
      if(visitar(next,folhas+(casas[next]==='L'?1:0)))return true;
      comandos.pop();
    }
    usadas.delete(pos);return false;
  }
  assert.ok(visitar(casas.indexOf('S'),0));return comandos;
}
function percorrerGesto(jogo, comandos) {
  const lado=jogo.snapshot().mapa.length, delta={left:-1,right:1,up:-lado,down:lado};
  let pos=jogo.snapshot().caminho.at(-1);
  jogo.point(...centroRastro(jogo,pos),'down');
  // Agrupa retas em um único evento: simula movimentos rápidos do ponteiro.
  for(let i=0;i<comandos.length;) {
    const dir=comandos[i];
    do {pos+=delta[comandos[i++]];}while(comandos[i]===dir);
    jogo.point(...centroRastro(jogo,pos),'move');
  }
  jogo.point(...centroRastro(jogo,pos),'up');
}
test('Rastro: gesto contínuo com eventos rápidos resolve três autorais e 100 geradas',()=>{
  for(const nivel of [1,2,3]) {
    const {jogo,resultados}=criar('rastro',nivel);
    percorrerGesto(jogo,resolverAutoral(jogo.snapshot().mapa));
    assert.equal(resultados[0]?.[0],true);
  }
  for(let seed=0;seed<100;seed++) {
    const {jogo,resultados}=criar('rastro',1,{mode:'generated',seed});
    percorrerGesto(jogo,jogo.snapshot().solucao);
    assert.equal(resultados[0]?.[0],true,`semente ${seed}`);
  }
});
test('Rastro: toque fora do caracol não inicia, soltar preserva e desfazer devolve folha',()=>{
  const {jogo}=criar('rastro',1), inicio=jogo.snapshot().caminho.at(-1);
  jogo.point(...centroRastro(jogo,inicio+1),'down');
  jogo.point(...centroRastro(jogo,inicio+2),'move');
  assert.deepEqual(jogo.snapshot().caminho,[inicio]);
  percorrerGesto(jogo,['up','up','up']);
  assert.equal(jogo.snapshot().folhas,1);
  const salvo=jogo.snapshot();jogo.point(95,95,'move');assert.deepEqual(jogo.snapshot(),salvo);
  percorrerGesto(jogo,['down']);assert.equal(jogo.snapshot().folhas,0);
  jogo.point(...centroRastro(jogo,jogo.snapshot().caminho.at(-1)),'down');
  jogo.cancelInput();jogo.point(0,0,'move');assert.equal(jogo.snapshot().caminho.at(-1),10);
});
test('Rastro: segmento não atravessa pedra nem entra no vaso sem folhas',()=>{
  const {jogo}=criar('rastro',1);
  percorrerGesto(jogo,['right','up','up']); // Casa 11 é pedra: fica em 16.
  assert.equal(jogo.snapshot().caminho.at(-1),16);
  jogo.point(...centroRastro(jogo,1),'move');assert.equal(jogo.snapshot().caminho.at(-1),16);
  const {jogo: outro}=criar('rastro',1);
  percorrerGesto(outro,['right','right','right','up','up','up','up','right']);
  assert.equal(outro.snapshot().fim,false);assert.notEqual(outro.snapshot().caminho.at(-1),4);
});

test('Rastro gerado rejeita atalhos e exige decisões numa grade de Puxado',()=>{
  let reservas=0;
  for(let seed=0;seed<150;seed++) {
    const fase=gerarRastro(seed), analise=buscarAtalhoRastro(fase.mapa);
    assert.equal(fase.mapa.length,7);assert.ok(fase.bifurcacoes>=6);
    assert.equal(analise.conclusivo,true);assert.equal(analise.encontrado,false);
    assert.ok(fase.solucao.length>=22);reservas+=fase.fallback;
  }
  assert.ok(reservas>0,'também exercita a reserva validada');
});
