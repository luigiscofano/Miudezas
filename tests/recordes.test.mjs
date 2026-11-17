import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizarRecordes,registrarRecorde,validarRecordes} from '../dist/recordes.js';
test('somente IDs contínuos e inteiros seguros não negativos',()=>{
 assert.deepEqual(normalizarRecordes({pipa:3,pisca:0,fio:-1,pao:2.5,goteira:'4',mare:9}),{pipa:3,pisca:0});
 for(const value of [null,[],{mare:3},{fio:-1},{pao:Infinity},{pisca:2**54}])assert.equal(validarRecordes(value),false);
 assert.equal(validarRecordes({fio:42}),true);
});
test('recorde só muda ao superar, sem mutar origem',()=>{
 const original={pipa:5};assert.equal(registrarRecorde(original,'pipa',5),original);
 assert.equal(registrarRecorde(original,'pipa',4),original);
 assert.equal(registrarRecorde(original,'mare',7),original);
 assert.deepEqual(registrarRecorde(original,'pipa',6),{pipa:6});assert.deepEqual(original,{pipa:5});
});
