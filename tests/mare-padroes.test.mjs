import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {gerarMare,gerarMareLegada,quintal} from '../dist/quintal.js';
function normalizar(grid) {
  const variantes=[];
  for(let mirror=0;mirror<2;mirror++){
    let rows=mirror?grid.map(row=>[...row].reverse().join('')):grid;
    for(let turn=0;turn<4;turn++){
      variantes.push(rows.join(''));
      rows=[...rows[0]].map((_,x)=>rows.map(row=>row[x]).reverse().join(''));
    }
  }
  return variantes.sort()[0];
}
test('gerador legado preserva os hashes das sementes reservadas',()=>{
  const fixtures={1:'fe4fbdead5cc977641605bbf4e42d05345ea08d58e7b4e00c259668713a721a9',2:'759eefcb5f0cb1da317b13a6178452c7495873931e7cd7b45ceba3b0b7b86e7d',4:'2b2fd873b2962d58e22ee287cee5708fa12b8f837af933743f5e82b3df13bccc',5:'a4e0fcca1b153e296b9a8f44634e36278b384c2dbe377e02d8d4c63253fd3059',100:'45ed0425ed30c6c1c379d3bb61ebcec3d53539dc645b4ad11c1db4d25b80a1cb',101:'2b00afdec362bda89199307396e9533eccbc942111d95f931c820732d15042f4'};
  for(const [seed,expected] of Object.entries(fixtures))assert.equal(createHash('sha256').update(JSON.stringify(gerarMareLegada(Number(seed)))).digest('hex'),expected);
});
test('100 enseadas: topologias novas, planejamento e solução real, incluindo reservas',()=>{
  const shapes=new Set(),starts=new Set(),goals=new Set();let fallback=0;
  for(let i=0;i<100;i++){
    const seed=i*10+1,map=gerarMare(seed);assert.equal(map.family,'enseada-irregular');
    assert.deepEqual(map,gerarMare(seed));
    assert.ok(map.metrics.passos>=23&&map.metrics.passos<=27);
    assert.ok(map.metrics.passos-map.metrics.passosSemMare>=5);
    assert.ok(map.metrics.baixiosObrigatorios>=3);
    assert.ok(map.metrics.passosSemPedras<map.metrics.passos);
    // Ignora pedras decorativas e equivalência por rotação/reflexão ao medir diversidade.
    shapes.add(normalizar(map.grid.map(row=>row.replaceAll('#','~'))));
    map.grid.forEach((row,y)=>{if(row.includes('S'))starts.add(`${row.indexOf('S')},${y}`);if(row.includes('C'))goals.add(`${row.indexOf('C')},${y}`);});
    fallback+=Number(map.fallback);
    const results=[];const game=quintal.mare(3,{tone(){},finish(...r){results.push(r);}},{mode:'generated',seed});
    for(const direction of map.solution)game.press(direction);
    assert.equal(results.length,1);assert.equal(results[0][0],true);
    assert.deepEqual(quintal.mare(3,{tone(){},finish(){}},{mode:'generated',seed}).snapshot().grid,map.grid);
  }
  assert.ok(shapes.size>=80);assert.ok(starts.size>=30&&goals.size>=25);assert.ok(fallback>0&&fallback<20);
});
