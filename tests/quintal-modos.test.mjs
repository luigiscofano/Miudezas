import {padroesMare, criteriosMareCanais} from '../dist/mare-canais.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quintal,gerarMare,resolverMare,criteriosMare,analisarMare,criteriosMareAvancada} from '../dist/quintal.js';
function criar(id,level=1,options={}){const results=[];const game=quintal[id](level,{tone(){},finish(...r){results.push(r);}},options);return {game,results};}
test('Maré: 300 sementes reproduzíveis, solução executada com maré real',()=>{
 for(let seed=0;seed<300;seed++){
  const map=gerarMare(seed); assert.deepEqual(map,gerarMare(seed));
  const advanced=criteriosMareAvancada[map.family] ?? (padroesMare[map.family] ? criteriosMareCanais : undefined);
  assert.ok(map.metrics.passos>=(advanced?.minPassos??criteriosMare.passosMinimos) && map.metrics.passos<=(advanced?.maxPassos??criteriosMare.passosMaximos));
  assert.ok(map.metrics.passos-map.metrics.passosSemMare>=criteriosMare.custoMinimoMare);
  assert.ok(map.metrics.baixiosObrigatorios>=criteriosMare.baixiosObrigatorios);
  assert.ok(map.metrics.passosSemPedras<map.metrics.passos, 'pedras devem impedir atalhos');
  const {game,results}=criar('mare',1,{mode:'generated',seed});
  for(const dir of map.solution)game.press(dir);
  assert.equal(results.length,1);assert.equal(results[0][0],true);
 }
 assert.equal(resolverMare(['S~~~~~~C']),null);
});
test('Goteira: quarta cabe, quinta transborda uma única vez e derrota é única',()=>{
 const {game,results}=criar('goteira',1,{mode:'endless'});
 let reachedFour=false,sawOverflow=false;
 for(let i=0;i<12000&&!results.length;i++){
  const s=game.snapshot();const next=s.drops.filter(d=>d.wait<=0).sort((a,b)=>b.y-a.y)[0];
  game.release('left');game.release('right');
  if(next&&Math.abs(next.x-s.x)>1)game.press(next.x>s.x?'right':'left');
  game.update(1/120);const after=game.snapshot();
  assert.ok(after.bucket<=4);
  if(after.bucket===4)reachedFour=true;
  if(reachedFour&&after.spilled>s.spilled){sawOverflow=true;assert.equal(after.spilled-s.spilled,1);}
 }
 assert.ok(reachedFour&&sawOverflow); assert.equal(results.length,1);assert.equal(results[0][0],false);
 const s=game.snapshot();for(let i=0;i<100;i++)game.update(.1);
 assert.equal(game.snapshot().spilled,s.spilled);assert.equal(results.length,1);
});
test('Goteira: limites progressivos documentados',()=>{assert.deepEqual([1,2,3].map(l=>criar('goteira',l).game.snapshot().floodLimit),[12,9,6]);});
for(const mode of ['classic','endless'])test(`Pipa: corredor executável e memória limitada (${mode})`,()=>{
 const {game,results}=criar('pipa',1,{mode});
 // Controle discreto permitido ao jogador: corrigir para o centro da passagem.
 for(let i=0;i<60*240&&!results.length;i++){
  const {y,passagem}=game.snapshot(),centro=mode==='endless'?22:(passagem?.centro??22);game.release('up');game.release('down');
  if(y>centro+.3)game.press('up');else if(y<centro-.3)game.press('down');
  game.update(1/60);assert.ok(game.snapshot().obstacles<=7);
 }
 if(mode==='endless'){assert.equal(results.length,0);assert.ok(game.score()>30);}else assert.equal(results[0][0],true);
});
test('Pipa: colisão termina uma única vez',()=>{const {game,results}=criar('pipa');game.press('down');for(let i=0;i<1000;i++)game.update(1/60);assert.equal(results.length,1);assert.equal(results[0][0],false);});
test('Fio: cinco mariposas não encerram Sem Parar, rajada encerra',()=>{
 const {game,results}=criar('fio',1,{mode:'endless'});let x=2,y=1;
 for(let loop=0;loop<3;loop++)for(const [tx,ty] of [[6,0],[4,2],[1,1],[7,2],[3,0]]){
  while(x!==tx){game.press(x<tx?'right':'left');x+=x<tx?1:-1;}
  while(y!==ty){game.press(y<ty?'down':'up');y+=y<ty?1:-1;}
 }
 assert.equal(game.score(),15);assert.equal(results.length,0);
 for(let i=0;i<200;i++)game.update(.05);
 assert.equal(results.length,1);assert.equal(results[0][0],false);
});

test('Maré: referência Puxado e fallback exigem maré; novas fases variam',()=>{
 assert.deepEqual(criteriosMare,{passosMinimos:17,passosMaximos:27,custoMinimoMare:3,baixiosObrigatorios:2});
 const grid=['.~~~~..C','~~~~~#..','~~~..=..','~~~#..~~','~..=.~~~','~..#~~~~','.#=.~~~~','S..~~~~~'];
 const a=analisarMare(grid);assert.ok(a.passos>=17&&a.passos<=27);assert.ok(a.passos-a.passosSemMare>=3);
 assert.ok(a.baixiosObrigatorios>=2);assert.ok(a.passosSemPedras<a.passos);
 const maps=new Set(),solutions=new Set();
 for(let seed=0;seed<60;seed++){const m=gerarMare(seed);maps.add(m.grid.join(''));solutions.add(m.solution.join(','));}
 assert.ok(maps.size>=50);assert.ok(solutions.size>=10);
});


test('Pipa exige movimento nas três fases e mantém passagens alcançáveis',()=>{
 for(const level of [1,2,3]){
  const parado=criar('pipa',level);
  for(let i=0;i<60*120&&!parado.results.length;i++)parado.game.update(1/60);
  assert.equal(parado.results[0][0],false,'parado não vence nível '+level);
  const acomodado=criar('pipa',level);
  for(let i=0;i<60*120&&!acomodado.results.length;i++){
   const estado=acomodado.game.snapshot();acomodado.game.release('up');acomodado.game.release('down');
   if(estado.passed===0){if(estado.y>22.3)acomodado.game.press('up');else if(estado.y<21.7)acomodado.game.press('down');}
   acomodado.game.update(1/60);
  }
  assert.equal(acomodado.results[0][0],false,'acomodar na primeira passagem e parar não vence');
  for(const dt of [1/30,1/60,1/120]){
   const {game,results}=criar('pipa',level);const sentidos=new Set();
   for(let i=0;i<120/dt&&!results.length;i++){
    const {y,passagem}=game.snapshot(),alvo=passagem?.centro??22;
    game.release('up');game.release('down');
    if(y>alvo+.8){game.press('up');sentidos.add('up');}
    else if(y<alvo-.8){game.press('down');sentidos.add('down');}
    game.update(dt);
   }
   assert.equal(results[0]?.[0],true,'trajetória executável '+level+' '+dt);
   assert.equal(sentidos.size,2);assert.equal(results.length,1);
  }
 }
 const configs=[1,2,3].map(l=>criar('pipa',l).game.snapshot());
 assert.deepEqual(configs.map(s=>s.velocidade),[14,17,20]);
 assert.deepEqual(configs.map(s=>s.passagem.margem),[8,7,6]);
});
