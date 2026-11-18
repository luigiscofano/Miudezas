import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {criarTerrenoGude,validarTerrenoGude,encontrarAtalhoGude,varanda} from '../dist/varanda.js';

const familias=['chicane','ferradura','ilha','degraus','bolso'];
const sementes=[0,6,2,8,4];
function executar(terreno,alterar=p=>p) {
  const resultados=[];
  const jogo=varanda.gude(3,{tone(){},finish(ok){resultados.push(ok);}},{terrenoValidado:terreno});
  const paradas=[];
  for(const [i,original] of terreno.solucao.entries()){
    const passo=alterar({...original},i);
    jogo.press(passo.direcao);jogo.update(passo.duracao);jogo.release(passo.direcao);
    for(let f=0;f<600&&jogo.moving;f++)jogo.update(1/60);
    assert.equal(jogo.moving,false,'cada tiro termina dentro do limite');
    paradas.push(jogo.snapshot());
  }
  return {resultados,paradas};
}

// Ocupação grosseira normalizada: trocar nomes, espelhar ou deslocar poucos
// pixels não cria uma nova arquitetura para esta comparação.
function assinatura(t){
  const variantes=[];
  for(let o=0;o<8;o++){
    const grade=Array(36).fill(0);
    for(const [x,y,w,h] of t.pedras)for(let px=x;px<x+w;px++)for(let py=y;py<y+h;py++){
      let a=px,b=py;if(o>=4)a=95-a;
      for(let r=0;r<o%4;r++)[a,b]=[95-b,a];
      grade[Math.floor(b/16)*6+Math.floor(a/16)]=1;
    }
    variantes.push(grade.join(''));
  }
  return variantes.sort()[0];
}

for(const [indice,familia] of familias.entries())test(`Novo Caminho: ${familia}, 20 sementes e força significativa`,()=>{
  const mapas=new Set(),inicios=new Set(),alvos=new Set();
  for(let n=0;n<20;n++){
    const seed=n*10+sementes[indice],t=criarTerrenoGude(seed);
    assert.equal(t.familia,'planejado-'+familia);
    assert.deepEqual(criarTerrenoGude(seed),t);
    // Inclui teclado ±15 ms e todos os 4³ erros de toque, a 30/60/120 Hz.
    assert.ok(validarTerrenoGude(t));
    assert.equal(t.solucao.length,3);
    assert.equal(encontrarAtalhoGude(t),null,'sem atalho na amostragem dirigida de dois tiros');
    for(let omitir=0;omitir<3;omitir++)assert.ok(!executar({...t,solucao:t.solucao.filter((_,i)=>i!==omitir)}).resultados.includes(true));
    assert.deepEqual(executar(t).resultados,[true]);
    let falhas=0;
    for(let i=0;i<3;i++)for(const fator of [.7,1.3]){
      const {resultados}=executar(t,(p,n)=>({...p,duracao:n===i?((5+68*p.duracao)*fator-5)/68:p.duracao}));
      if(!resultados.includes(true))falhas++;
    }
    assert.ok(falhas>=4);assert.equal(t.desafioForca,falhas);
    mapas.add(JSON.stringify(t.pedras));inicios.add(t.inicio.join());alvos.add(t.alvo.join());
  }
  assert.ok(mapas.size>=18);assert.ok(inicios.size>=15);assert.ok(alvos.size>=15);
});

test('Cinco arquiteturas distintas mesmo retirando rotações e reflexões',()=>{
  assert.equal(new Set(familias.map((_,i)=>assinatura(criarTerrenoGude(sementes[i])))).size,5);
});

test('Bolso elimina o primeiro tiro decorativo e bloqueia a saída curta da versão anterior',()=>{
  // Reproduz a crítica: [40,60] -> [30,60] dispensa o antigo ricochete.
  const antigo={inicio:[40,60],alvo:[72,24],pedras:[[42,35,20,15],[42,71,20,12],[10,28,9,20]],
    solucao:[{direcao:'left',duracao:(10-5)/68},{direcao:'up',duracao:(36-5)/68},{direcao:'right',duracao:(42-5)/68}]};
  assert.deepEqual(executar(antigo).resultados,[true],'o atalho antigo é reproduzível');
  const direcoes={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]};
  for(let n=0;n<20;n++){
    const t=criarTerrenoGude(4+n*10),{paradas}=executar(t);
    const deslocamento=Math.hypot(paradas[0].x-t.inicio[0],paradas[0].y-t.inicio[1]);
    assert.ok(deslocamento>50,'é preciso sair do bolso comprido');
    assert.ok(Math.abs(deslocamento-(5+68*t.solucao[0].duracao))<.001,'o certificado não infla alcance com ida e volta');
    assert.ok(!executar(t,(p,i)=>i===0?{...p,duracao:(10-5)/68}:p).resultados.includes(true));
    for(const dt of [1/30,1/60,1/120]){
      const resultados=[],j=varanda.gude(3,{tone(){},finish(ok){resultados.push(ok);}},{terrenoValidado:t});
      for(const [i,p] of t.solucao.entries()){
        const {x,y}=j.snapshot(),[dx,dy]=direcoes[p.direcao],alcance=i===0?10:5+68*p.duracao;
        j.point(x,y,'down');j.point(x-dx*alcance/3.6,y-dy*alcance/3.6,'up');
        for(let q=0;q<600&&j.moving;q++)j.update(dt);
      }
      assert.ok(!resultados.includes(true),'a saída curta também falha por toque');
    }
  }
});

test('A busca de atalhos devolve gestos reproduzíveis em um mapa fácil',()=>{
  const terreno={inicio:[30,70],alvo:[70,30],pedras:[]};
  const tiros=encontrarAtalhoGude(terreno);
  assert.ok(tiros&&tiros.length<=2);
  const resultados=[],j=varanda.gude(3,{tone(){},finish(ok){resultados.push(ok);}},{terrenoValidado:terreno});
  for(const {angulo,alcance} of tiros){
    const {x,y}=j.snapshot();j.point(x,y,'down');j.point(x-Math.cos(angulo)*alcance/3.6,y-Math.sin(angulo)*alcance/3.6,'up');
    for(let q=0;q<600&&j.moving;q++)j.update(1/60);
  }
  assert.deepEqual(resultados,[true]);
});

test('Rejeitar todos os novos candidatos termina em fallback antigo certificado',async()=>{
  // Instrumenta apenas a decisão de aceitação: permite exercer uma falha rara
  // sem inserir opções de depuração ou trocar a física do jogo em produção.
  const fonte=await readFile(new URL('../dist/varanda.js',import.meta.url),'utf8');
  const instrumentada=fonte.replace('export function validarTerrenoGude(terreno)', 'function validarOriginal(terreno)').replace('function montarPadraoGude(', 'function montarOriginal(')+`
    export const rejeitados=[],candidatos=[];
    function montarPadraoGude(...args){const t=montarOriginal(...args);candidatos.push(t);return t;}
    export function validarTerrenoGude(t){
      if(t.familia?.startsWith('planejado-')){rejeitados.push(t);return false;}
      return validarOriginal(t);
    }
  `;
  const modulo=await import('data:text/javascript;base64,'+Buffer.from(instrumentada).toString('base64'));
  for(let i=0;i<5;i++){
    const antes=modulo.candidatos.length,t=modulo.criarTerrenoGude(sementes[i]);
    assert.equal(modulo.candidatos.length-antes,12);
    assert.ok(!t.familia.startsWith('planejado-'));
    assert.ok(validarTerrenoGude(t));
    const base=modulo.candidatos.at(-1);
    assert.equal(encontrarAtalhoGude(base),null);
    assert.equal(base.orientacao,0);assert.ok(validarTerrenoGude(base),'a última tentativa conhecida também é executável');
  }
});
