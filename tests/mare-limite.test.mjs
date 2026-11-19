import test from 'node:test';
import assert from 'node:assert/strict';
import {quintal,gerarMare,resolverMare} from '../dist/quintal.js';
import {catalogo} from '../dist/catalogo.js';
import {caminhoParaMare} from './mare-apoio.mjs';

for(const [nome,level,options] of [
  ['Sossegado',1,{}],
  ...Array.from({length:10},(_,seed)=>seed).filter(seed=>![1,9].includes(seed)).map(seed=>['Caminho Novo '+seed,3,{mode:'generated',seed}])
]) test(`${nome}: duas recuperações, terceira derrota única e reinício limpo`,()=>{
  const results=[],create=()=>quintal.mare(level,{tone(){},finish(...r){results.push(r);}},options);
  const game=create(),initial=game.snapshot();
  assert.match(game.hud(),/Maré levou 0\/3/);
  for(let count=1;count<=3;count++) {
    const path=caminhoParaMare(game.snapshot());
    let safe={x:game.snapshot().x,y:game.snapshot().y};
    for(const dir of path){
      const before=game.snapshot();
      if(before.grid[before.y][before.x]!=='=')safe={x:before.x,y:before.y};
      game.press(dir);
    }
    const state=game.snapshot();
    assert.equal(state.levadas,count);assert.equal(state.done,count===3);
    assert.equal(results.length,count===3?1:0);
    if(count<3)assert.deepEqual({x:state.x,y:state.y},safe);
    for(let n=0;n<10;n++){game.update(.1);game.release('up');game.press('invalido');}
    assert.equal(game.snapshot().levadas,count);
    assert.match(game.hud(),new RegExp(`Maré levou ${count}/3`));
  }
  assert.deepEqual(results,[[false,'A maré te levou! Três vezes na mesma tentativa.']]);
  const ended=game.snapshot();
  for(let n=0;n<20;n++){for(const dir of ['up','down','left','right'])game.press(dir);game.update(1);}
  assert.deepEqual(game.snapshot(),ended);assert.equal(results.length,1);
  const restarted=create();assert.deepEqual(restarted.snapshot(),initial);
  const solution=options.mode?gerarMare(options.seed).solution:resolverMare(initial.grid);
  for(const dir of solution)restarted.press(dir);
  assert.equal(results.length,2);assert.equal(results[1][0],true);
  assert.ok(restarted.snapshot().levadas<3);
});

test('regra do catálogo informa recuperação e limite em todos os modos',()=>{
  const regra=catalogo.find(g=>g.id==='mare').regra;
  assert.match(regra,/duas primeiras vezes devolvem à areia/);
  assert.match(regra,/terceira encerra a tentativa em qualquer modo/);
});

// Alguns mapas não permitem subir a água sobre um baixio pela paridade dos passos.
// A fixture expõe a mesma regra nos níveis 2/3, sem alterar mapas de produção.
for (const level of [2,3]) test(`nível ${level}: limite com costa de exposição controlada`, async()=>{
  const {readFile}=await import('node:fs/promises');
  const source=(await readFile(new URL('../dist/quintal.js',import.meta.url),'utf8'))
    .replace(/from '(\.\/[^']+)'/g,(_,file)=>'from '+JSON.stringify(new URL('../dist/'+file.slice(2),import.meta.url).href))
    .replace(/const shores = \[[\s\S]*?\n\];/, 'const shores = '+JSON.stringify(Array(3).fill(quintal.mare(1,{tone(){},finish(){}}).snapshot().grid))+';');
  const {quintal:fixture}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  const results=[],game=fixture.mare(level,{tone(){},finish(ok){results.push(ok);}});
  for(let n=1;n<=3;n++) { for(const d of caminhoParaMare(game.snapshot()))game.press(d);assert.equal(game.snapshot().levadas,n);assert.equal(results.length,n===3?1:0); }
  assert.deepEqual(results,[false]);
});
for(const level of [2,3])test(`mapa autoral ${level}: solução preservada no mapa original`,()=>{
 const results=[],game=quintal.mare(level,{tone(){},finish(ok){results.push(ok);}});

 for(const d of resolverMare(game.snapshot().grid))game.press(d);
 assert.deepEqual(results,[true]);assert.equal(game.snapshot().levadas,0);
});

test('certificado que dependia de três ocorrências recebe alternativa no mesmo mapa',async()=>{
 const {gerarMareLegada}=await import('../dist/quintal.js');
 const map=gerarMareLegada(7);
 // Certificado anterior do arquipélago: precisa ser substituído, não o tabuleiro.
 const old=['right','left','right','left','right','up','right','right','left','right','left','right','right','right','left','right','left','right','up','up','down','up','left','right','up','up','up'];
 function levadas(path){
  let y=map.grid.findIndex(row=>row.includes('S')),x=map.grid[y].indexOf('S'),sx=x,sy=y,count=0,steps=0;
  for(const dir of path){
   const [dx,dy]={right:[1,0],left:[-1,0],up:[0,-1],down:[0,1]}[dir];
   x+=dx;y+=dy;steps++;
   if(map.grid[y][x]!=='='){sx=x;sy=y;}
   if(map.grid[y][x]==='='&&steps%6===3){count++;x=sx;y=sy;}
  }
  return count;
 }
 assert.ok(levadas(old)>=3);assert.ok(levadas(map.solution)<3);
 assert.equal(map.solution.length,old.length);
});
