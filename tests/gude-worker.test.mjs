import test from 'node:test';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {solicitarTerrenoGude} from '../dist/gude-assincrono.js';
import {criarTerrenoGude,varanda} from '../dist/varanda.js';

function workerReal(){
 const url=new URL('../dist/gude-worker.js',import.meta.url).href;
 const w=new Worker(`const {parentPort}=require('node:worker_threads');global.self={postMessage:m=>parentPort.postMessage(m)};import(${JSON.stringify(url)}).then(()=>parentPort.on('message',data=>self.onmessage({data})));`,{eval:true});
 const ponte={postMessage:m=>w.postMessage(m),terminate:()=>w.terminate()};
 w.on('message',data=>ponte.onmessage?.({data}));w.on('error',e=>ponte.onerror?.(e));return ponte;
}

test('Worker real retorna os mesmos mapas certificados sem compartilhar estado',async()=>{
 for(const seed of [0,6,2,8,4,3]){
  const t=await solicitarTerrenoGude(seed,workerReal).promise;
  assert.deepEqual(t,criarTerrenoGude(seed));
 }
 const t=criarTerrenoGude(4),j=varanda.gude(3,{tone(){},finish(){}},{terrenoValidado:t});
 const pos=j.position();pos.x=-999;assert.equal(j.position().x,t.inicio[0]);
 const snap=j.snapshot();snap.terreno.pedras.length=0;assert.deepEqual(j.snapshot().terreno,t);
});

test('Cancelar termina o worker e ignora retorno tardio; falhas não geram na interface',async()=>{
 let terminou=0,w;
 const criar=()=>w={terminate(){terminou++;},postMessage(){}};
 const t=solicitarTerrenoGude(4,criar);t.cancel();await assert.rejects(t.promise,{name:'AbortError'});
 w.onmessage({data:{terreno:{semente:4}}});t.cancel();assert.equal(terminou,1);
 for(const evento of ['onerror','onmessageerror']){
  const erro=solicitarTerrenoGude(4,criar);w[evento]();await assert.rejects(erro.promise);
 }
 const errado=solicitarTerrenoGude(4,criar);w.onmessage({data:{terreno:{semente:5}}});await assert.rejects(errado.promise);
 await assert.rejects(solicitarTerrenoGude(4,()=>{throw new Error('Worker indisponível');}).promise);
});

test('Prazo do worker termina sem mapa e libera recurso',async(t)=>{
 t.mock.timers.enable({apis:['setTimeout']});
 let terminou=0;
 const tarefa=solicitarTerrenoGude(0,()=>({postMessage(){},terminate(){terminou++;}}));
 const rejeicao=assert.rejects(tarefa.promise,/demorou/);
 t.mock.timers.tick(30000);await rejeicao;assert.equal(terminou,1);
});


test('Otimização conserva byte a byte 30 mapas da revisão anterior',()=>{
 const hash=createHash('sha256');
 for(let n=0;n<30;n++)hash.update(JSON.stringify(criarTerrenoGude(n*2)));
 assert.equal(hash.digest('hex'),'2af0066fe10e567fa70f56e2bd36ef4076829f51b2647b7a4703a8a20a73fbab');
});
