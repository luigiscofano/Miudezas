import test from 'node:test';
import assert from 'node:assert/strict';
import {quintal,gerarMare,analisarMare} from '../dist/quintal.js';
test('Puxado reproduz mapa escolhido e inicia siri na última linha',()=>{
 const original=gerarMare(1428316038).grid.map(row=>row.replace('S','.'));
 original[7]=original[7].slice(0,3)+'S'+original[7].slice(4);
 const resultados=[],jogo=quintal.mare(3,{tone(){},finish(ok){resultados.push(ok);}});
 const estado=jogo.snapshot();assert.deepEqual(estado.grid,original);
 assert.equal(estado.x,3);assert.equal(estado.y,7);
 const analise=analisarMare(original);
 assert.equal(analise.passos,21);assert.equal(analise.passosSemMare,15);assert.equal(analise.baixiosObrigatorios,4);
 for(const comando of analise.solution)jogo.press(comando);
 assert.deepEqual(resultados,[true]);jogo.press('up');assert.deepEqual(resultados,[true]);
});
