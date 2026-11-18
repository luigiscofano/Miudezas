import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {criarTerrenoGude,validarTerrenoGude,varanda} from '../dist/varanda.js';

const familias=['chicane','ferradura','ilha','degraus','ricochete'];
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
    const seed=(n*5+indice)*17,t=criarTerrenoGude(seed);
    assert.equal(t.familia,'planejado-'+familia);
    assert.deepEqual(criarTerrenoGude(seed),t);
    // Inclui teclado ±15 ms e todos os 4³ erros de toque, a 30/60/120 Hz.
    assert.ok(validarTerrenoGude(t));
    assert.equal(t.solucao.length,3);
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
  assert.equal(new Set(familias.map((_,i)=>assinatura(criarTerrenoGude(i*17)))).size,5);
});

test('Ricochete certificado realmente inverte o movimento na borda',()=>{
  const t=criarTerrenoGude(68),primeiro=t.solucao[0];
  const {paradas}=executar(t);
  const deslocamento=Math.hypot(paradas[0].x-t.inicio[0],paradas[0].y-t.inicio[1]);
  assert.ok(5+68*primeiro.duracao>deslocamento+30,'o alcance inclui ida e volta, não um tiro direto renomeado');
});

test('Rejeitar todos os novos candidatos termina em fallback antigo certificado',async()=>{
  // Instrumenta apenas a decisão de aceitação: permite exercer uma falha rara
  // sem inserir opções de depuração ou trocar a física do jogo em produção.
  const fonte=await readFile(new URL('../dist/varanda.js',import.meta.url),'utf8');
  const instrumentada=fonte.replace('export function validarTerrenoGude(terreno)', 'function validarOriginal(terreno)')+`
    export const rejeitados=[];
    export function validarTerrenoGude(t){
      if(t.familia?.startsWith('planejado-')){rejeitados.push(t);return false;}
      return validarOriginal(t);
    }
  `;
  const modulo=await import('data:text/javascript;base64,'+Buffer.from(instrumentada).toString('base64'));
  for(let i=0;i<5;i++){
    const antes=modulo.rejeitados.length,t=modulo.criarTerrenoGude(i*17);
    assert.equal(modulo.rejeitados.length-antes,12);
    assert.ok(!t.familia.startsWith('planejado-'));
    assert.ok(validarTerrenoGude(t));
    const base=modulo.rejeitados.at(-1);
    assert.equal(base.orientacao,0);assert.ok(validarTerrenoGude(base),'a última tentativa conhecida também é executável');
  }
});
