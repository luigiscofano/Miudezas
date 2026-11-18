import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {catalogo} from '../dist/catalogo.js';
import {inventario} from '../scripts/inventario-elementos.mjs';
import {extrairElementos,svgElemento,pranchaElementos} from '../scripts/gerar-elementos-visuais.mjs';

test('Inventário cobre exatamente os dez jogos ativos',()=>{
 assert.deepEqual(Object.keys(inventario).sort(),catalogo.map(j=>j.id).sort());
});
for(const {id,nome} of catalogo) test(`Acervo de ${id} corresponde a todos os retângulos do quadro real`,async()=>{
 const {grupos,total}=await extrairElementos(id);
 assert.equal(grupos.reduce((s,g)=>s+g.formas.length,0),total);
 for(const grupo of grupos){
  assert.ok(grupo.formas.length>0,grupo.slug);
  const svg=svgElemento(grupo);
  assert.equal(await readFile(new URL(`../docs/elementos-visuais/${id}/${grupo.slug}.svg`,import.meta.url),'utf8'),svg);
  assert.doesNotMatch(svg,/<script|<image|https?:\/\/(?!www.w3.org)/);
 }
 assert.equal(await readFile(new URL(`../docs/elementos-visuais/${id}/prancha.svg`,import.meta.url),'utf8'),pranchaElementos(grupos,nome));
 const repeticao=await extrairElementos(id);
 assert.deepEqual(repeticao.grupos,grupos,'extração precisa ser determinística');
});
test('Extração rejeita jogo inexistente e grupo sem desenho',async()=>{
 await assert.rejects(extrairElementos('peteca'),/não inventariado/);
 assert.throws(()=>svgElemento({slug:'vazio',formas:[]}),/sem representação/);
});
