import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {criarAudio,TRILHAS,EFEITOS} from '../dist/audio.js';
function ambiente({falha=false,adiar=false}={}){
 const fontes=[],pedidos=[],pendentes=[],ganhos=[];let criados=0;
 const param=()=>({value:1,eventos:[],setValueAtTime(v){this.value=v;this.eventos.push(['set',v]);},linearRampToValueAtTime(v){this.value=v;this.eventos.push(['ramp',v]);},exponentialRampToValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;this.eventos.push(['target',v]);},cancelScheduledValues(){this.eventos.push(['cancel']);}});
 const ctx={state:'suspended',currentTime:1,destination:{},resume:async()=>{ctx.state='running';},suspend:async()=>{ctx.state='suspended';},decodeAudioData:async x=>({x}),createGain:()=>{const g={gain:param(),connect(){},disconnect(){}};ganhos.push(g);return g;},createBufferSource:()=>{const f={connect(){},disconnect(){},start(){this.started=true;},stop(t){this.stopped=true;if(!t)this.onended?.();}};fontes.push(f);return f;},createOscillator(){const f=this.createBufferSource();f.frequency={};return f;}};
 const som=criarAudio({contexto:()=>{criados++;return ctx;},buscar:url=>{pedidos.push(url.pathname);const resposta={ok:!falha,arrayBuffer:async()=>new ArrayBuffer(8)};return adiar?new Promise(r=>pendentes.push(()=>r(resposta))):Promise.resolve(resposta);}});
 return {som,ctx,fontes,pedidos,pendentes,ganhos,get criados(){return criados;}};
}
const limpar=()=>new Promise(r=>setImmediate(r));
test('Arquivos aprovados cobrem todas as telas e os nove efeitos',()=>{
 for(const tela of TRILHAS)assert.ok(existsSync(new URL('../dist/audio/musicas/'+tela+'.flac',import.meta.url)));
 for(const nome of EFEITOS)assert.ok(existsSync(new URL('../dist/audio/efeitos/'+nome+'.wav',import.meta.url)));
 const manifest=JSON.parse(readFileSync(new URL('../dist/audio/manifesto.json',import.meta.url)));
 assert.equal(Object.keys(manifest).length,9);
});
test('Nenhum contexto/rede antes da ativação; mute encerra fontes; reativar funciona',async()=>{
 const a=ambiente();a.som.mudar('galeria');assert.equal(a.criados,0);assert.equal(a.pedidos.length,0);
 await a.som.ativar();assert.equal(a.fontes.length,1);assert.equal(a.fontes[0].loop,true);
 await a.som.ativar(false);assert.ok(a.fontes[0].stopped);await a.som.ativar();assert.equal(a.criados,1);assert.equal(a.pedidos.length,1);
});
test('Navegação repetida reutiliza buffers e não reinicia a mesma tela',async()=>{
 const a=ambiente();await a.som.ativar();a.som.mudar('inicio');await limpar();assert.equal(a.fontes.length,1);
 a.som.mudar('jogo','pisca');await limpar();assert.equal(a.fontes.length,2);assert.ok(a.fontes[0].stopped);
 a.som.mudar('inicio');await limpar();assert.equal(a.pedidos.length,2);
});
test('Requisição obsoleta não toca; desligar durante download não vaza áudio',async()=>{
 const a=ambiente({adiar:true});const p=a.som.ativar();a.som.mudar('pausa');await limpar();a.som.ativar(false);
 a.pendentes.forEach(f=>f());await p;await limpar();assert.equal(a.fontes.length,0);
});
test('Ocultar aba suspende; retornar exige gesto; falha de rede não quebra jogo',async()=>{
 const a=ambiente();await a.som.ativar();a.som.visibilidade(false);await limpar();assert.equal(a.ctx.state,'suspended');
 a.som.visibilidade(true);assert.equal(a.ctx.state,'suspended');await a.som.ativar();assert.equal(a.ctx.state,'running');
 const b=ambiente({falha:true});await b.som.ativar();assert.equal(b.fontes.length,0);
});
test('Sinais essenciais conservam frequência e efeitos respeitam limite de vozes',async()=>{
 const a=ambiente();await a.som.ativar();a.som.sinal(587,.18);assert.equal(a.fontes.at(-1).frequency.value,587);
 for(let i=0;i<30;i++){a.ctx.currentTime+=.1;await a.som.efeito('coleta');}
 assert.ok(a.fontes.filter(x=>!x.stopped).length<=10);
});
test('Cache musical limitado permite recarregar faixa antiga',async()=>{
 const a=ambiente();await a.som.ativar();for(const t of ['galeria','nivel','jogo']){a.som.mudar(t);await limpar();}
 a.som.mudar('inicio');await limpar();assert.equal(a.pedidos.filter(p=>p.endsWith('/inicio.flac')).length,2);
});

test('Vitória/derrota/recorde não são bloqueados pelo acerto do mesmo quadro',async()=>{
 for(const nome of ['vitoria','derrota','recorde']){
  const a=ambiente();await a.som.ativar();
  await Promise.all([a.som.efeito('acerto'),a.som.efeito(nome)]);
  assert.ok(a.pedidos.some(p=>p.endsWith('/'+nome+'.wav')));
  assert.equal(a.fontes.length,2,'som comum pendente é substituído, não misturado');
 }
});
test('Vinheta terminal substitui efeito já ativo e impede recorde de sobrepô-la enquanto carrega',async()=>{
 const a=ambiente();await a.som.ativar();await a.som.efeito('acerto');
 const comum=a.fontes.at(-1);const terminal=a.som.efeito('vitoria');
 await a.som.efeito('recorde');await terminal;
 assert.ok(comum.stopped);assert.ok(!a.pedidos.some(p=>p.endsWith('/recorde.wav')));
});
test('Mudança de volume cancela rampa antiga antes de agendar novo ganho',async()=>{
 const a=ambiente();await a.som.ativar();const musica=a.ganhos[2].gain;musica.eventos=[];
 a.som.volumes(0,.5);assert.deepEqual(musica.eventos.map(e=>e[0]),['cancel','set','target']);assert.equal(musica.eventos.at(-1)[1],0);
 musica.eventos=[];a.som.mudar('inicio');assert.deepEqual(musica.eventos.map(e=>e[0]),['cancel','set','target']);
 musica.eventos=[];musica.cancelAndHoldAtTime=()=>musica.eventos.push(['hold']);
 a.som.volumes(.3,.5);assert.deepEqual(musica.eventos,[['hold'],['target',.3]]);
});
test('Player inicia com música 10% e efeitos 25% antes de qualquer ajuste',async()=>{
 const a=ambiente();await a.som.ativar();
 assert.equal(a.ganhos[1].gain.value,.25);assert.equal(a.ganhos[2].gain.value,.10);
});
