import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quintal,gerarMare,resolverMare} from '../dist/quintal.js';
function criar(id,level=1,options={}){const results=[];const game=quintal[id](level,{tone(){},finish(...r){results.push(r);}},options);return {game,results};}
test('Maré: 300 sementes reproduzíveis, solução executada com maré real',()=>{
 for(let seed=0;seed<300;seed++){
  const map=gerarMare(seed); assert.deepEqual(map,gerarMare(seed));assert.ok(map.solution.length>=14);
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
  const {y}=game.snapshot();game.release('up');game.release('down');
  if(y>22.3)game.press('up');else if(y<21.7)game.press('down');
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
