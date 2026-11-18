import test from 'node:test';
import assert from 'node:assert/strict';
import {gerarMare,quintal,criteriosMareAvancada} from '../dist/quintal.js';
function canonical(grid){let all=[];for(let mirror=0;mirror<2;mirror++){let rows=mirror?grid.map(r=>[...r].reverse().join('')):grid;for(let turn=0;turn<4;turn++){all.push(rows.join(''));rows=[...rows[0]].map((_,x)=>rows.map(r=>r[x]).reverse().join(''));}}return all.sort()[0];}
for(const [tier,mod] of [['muito-dificil',3],['muitissimo-dificil',4]])test(`${tier}: 100 seeds, provas reais, reservas e diversidade normalizada`,()=>{
 const shapes=new Set();let fallbacks=0;
 for(let i=1,n=0;n<100;i++){
  const seed=(i-1)*10+mod;n++;
  const map=gerarMare(seed),m=map.metrics,limits=criteriosMareAvancada[tier];
  assert.equal(map.family,tier);assert.deepEqual(map,gerarMare(seed));
  assert.ok(m.passos>=limits.minPassos&&m.passos<=limits.maxPassos);
  assert.ok(m.passos-m.passosSemMare>=limits.custoMare);
  assert.ok(m.passos-m.passosSemMare<=(limits.custoMaximo??Infinity));
  assert.ok(m.baixiosObrigatorios>=limits.portais);assert.ok(m.passosSemPedras<m.passos);
  assert.ok(m.escolhas>=8&&m.ciclosAreia>=2);
  shapes.add(canonical(map.grid.map(r=>r.replaceAll('#','~'))));fallbacks+=Number(map.fallback);
  const results=[];const game=quintal.mare(3,{tone(){},finish(...r){results.push(r);}},{mode:'generated',seed});
  for(const dir of map.solution)game.press(dir);assert.deepEqual(results.map(r=>r[0]),[true]);
  assert.deepEqual(quintal.mare(3,{tone(){},finish(){}},{mode:'generated',seed}).snapshot().grid,map.grid);
 }
 assert.ok(shapes.size>=40);assert.ok(fallbacks>0&&fallbacks<70);
});
test('a mistura mantém todas as famílias anteriores e a semente de referência',()=>{
 assert.equal(gerarMare(1428316038).family,'enseada-irregular');
 assert.equal(gerarMare(1).family,'enseada-irregular');assert.equal(gerarMare(2).family,'arquipelago');
 assert.equal(gerarMare(0).family,undefined);
});
