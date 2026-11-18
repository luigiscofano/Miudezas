import test from 'node:test';
import assert from 'node:assert/strict';
import {gerarMare,quintal} from '../dist/quintal.js';
const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
function canon(grid){const all=[];for(let flip=0;flip<2;flip++){let rows=flip?grid.map(r=>[...r].reverse().join('')):grid;for(let i=0;i<4;i++){all.push(rows.join(''));rows=[...rows[0]].map((_,x)=>rows.map(r=>r[x]).reverse().join(''));}}return all.sort()[0];}
test('arquipélagos: 100 soluções reais, desvios e diversidade além de orientação',()=>{
 const shapes=new Set();let minJunctions=64;
 for(let i=1,count=0;count<100;i++){
  count++;
  const seed=(i-1)*10+2,map=gerarMare(seed);assert.equal(map.family,'arquipelago');assert.deepEqual(map,gerarMare(seed));
  assert.ok(map.metrics.passos>=23&&map.metrics.passos<=27);
  assert.ok(map.metrics.passos-map.metrics.passosSemMare>=7);
  assert.ok(map.metrics.baixiosObrigatorios>=3);assert.ok(map.metrics.passosSemPedras<map.metrics.passos);
  shapes.add(canon(map.grid.map(row=>row.replaceAll('#','~'))));
  let junctions=0;map.grid.forEach((row,y)=>[...row].forEach((cell,x)=>{if('.SC='.includes(cell)&&dirs.filter(([dx,dy])=>'.SC='.includes(map.grid[y+dy]?.[x+dx]??'!')).length>=3)junctions++;}));
  minJunctions=Math.min(minJunctions,junctions);
  const results=[];const game=quintal.mare(3,{tone(){},finish(...r){results.push(r);}},{mode:'generated',seed});
  for(const dir of map.solution)game.press(dir);assert.deepEqual(results.map(r=>r[0]),[true]);
 }
 assert.ok(shapes.size>=90);assert.ok(minJunctions>=8,'ilhas devem oferecer escolhas, não só um corredor');
});
test('as duas famílias anteriores continuam disponíveis; referência solicitada preservada',()=>{
 assert.equal(gerarMare(1428316038).family,'enseada-irregular');
 assert.equal(gerarMare(1).family,'enseada-irregular');assert.equal(gerarMare(0).family,undefined);
});
