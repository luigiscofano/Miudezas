import {test} from 'node:test';
import assert from 'node:assert/strict';
import {criarExclusividade} from '../dist/audio-exclusivo.js';
const turno=()=>new Promise(r=>setImmediate(r));
test('Lock serializa áudio e invalida pedido cancelado antes de adquirir',async()=>{
 let fila=Promise.resolve(),simultaneos=0,maximo=0;
 const locks={request(nome,callback){const p=fila.then(async()=>{maximo=Math.max(maximo,++simultaneos);try{await callback();}finally{simultaneos--;}});fila=p;return p;}};
 const a=criarExclusividade({locks}),b=criarExclusividade({locks});assert.equal(await a.obter(),true);
 const pedido=b.obter();b.ceder();a.ceder();assert.equal(await pedido,false);await turno();
 assert.equal(await b.obter(),true);b.ceder();await turno();assert.equal(maximo,1);
});
test('Falha de exclusividade não autoriza áudio concorrente',async()=>{
 const a=criarExclusividade({locks:{request:async()=>{throw Error('indisponível');}}});assert.equal(await a.obter(),false);a.ceder();
});
