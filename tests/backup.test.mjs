import test from 'node:test';
import assert from 'node:assert/strict';
import {criarBackup,validarBackup,importarBackup,chaves} from '../dist/backup.js';
const memoria=()=>{const mapa=new Map();return {getItem:k=>mapa.get(k)??null,setItem:(k,v)=>mapa.set(k,v),removeItem:k=>mapa.delete(k)}};
test('backup transfere volta e som entre origens sem modificar a fonte',()=>{const origem=memoria(),destino=memoria();origem.setItem(chaves[0],'true');origem.setItem(chaves[1],JSON.stringify({nivel:2,ids:['goteira','mare'],resultados:[true]}));const texto=JSON.stringify(criarBackup(origem));importarBackup(destino,validarBackup(texto));assert.equal(JSON.stringify(criarBackup(destino)),texto);assert.equal(JSON.stringify(criarBackup(origem)),texto);assert.ok(destino.getItem('miudezas.backup.anterior'));});
test('rejeita dados estranhos sem alterar destino',()=>{for(const texto of ['{}','{"aplicacao":"Outra","versao":1,"dados":{}}','x'.repeat(100001)])assert.throws(()=>validarBackup(texto));});
test('backup vazio é válido e não inventa progresso',()=>{const b=validarBackup(JSON.stringify(criarBackup(memoria())));assert.equal(b.dados[chaves[1]],null);});
