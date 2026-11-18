import test from 'node:test';
import assert from 'node:assert/strict';
import {criarBackup,validarBackup,importarBackup,chaves} from '../dist/backup.js';
const memoria=()=>{const mapa=new Map();return {getItem:k=>mapa.get(k)??null,setItem:(k,v)=>mapa.set(k,v),removeItem:k=>mapa.delete(k)}};
test('backup transfere volta e som entre origens sem modificar a fonte',()=>{const origem=memoria(),destino=memoria();origem.setItem(chaves[0],'true');origem.setItem(chaves[1],JSON.stringify({nivel:2,ids:['goteira','mare'],resultados:[true]}));const texto=JSON.stringify(criarBackup(origem));importarBackup(destino,validarBackup(texto));assert.equal(JSON.stringify(criarBackup(destino)),texto);assert.equal(JSON.stringify(criarBackup(origem)),texto);assert.ok(destino.getItem('miudezas.backup.anterior'));});
test('rejeita dados estranhos sem alterar destino',()=>{for(const texto of ['{}','{"aplicacao":"Outra","versao":1,"dados":{}}','x'.repeat(100001)])assert.throws(()=>validarBackup(texto));});
test('backup vazio é válido e não inventa progresso',()=>{const b=validarBackup(JSON.stringify(criarBackup(memoria())));assert.equal(b.dados[chaves[1]],null);});
test('schema 2 exporta recordes; importar preserva o maior valor',()=>{
 const source=memoria(),target=memoria();source.setItem(chaves[2],JSON.stringify({pipa:8,pisca:12}));target.setItem(chaves[2],JSON.stringify({pipa:10,fio:4}));
 const backup=validarBackup(JSON.stringify(criarBackup(source)));assert.equal(backup.versao,3);importarBackup(target,backup);
 assert.deepEqual(JSON.parse(target.getItem(chaves[2])),{pipa:10,fio:4,pisca:12});
});
test('schema 1 sem recordes não apaga recordes existentes',()=>{
 const target=memoria();target.setItem(chaves[2],'{"pao":17}');
 importarBackup(target,{aplicacao:'Miudezas',versao:1,dados:{[chaves[0]]:'false',[chaves[1]]:null}});
 assert.equal(target.getItem(chaves[2]),'{"pao":17}');
});
test('rejeita recordes inválidos e schema 2 incompleto antes de alterar storage',()=>{
 for(const raw of ['{"mare":3}','{"pao":-2}','{"pipa":1.5}','null']){
 const backup=criarBackup(memoria());backup.dados[chaves[2]]=raw;assert.throws(()=>validarBackup(JSON.stringify(backup)));
 }
 const backup=criarBackup(memoria());delete backup.dados[chaves[2]];assert.throws(()=>validarBackup(JSON.stringify(backup)));
});
test('falha de escrita restaura os dados anteriores',()=>{
 const store=memoria();store.setItem(chaves[0],'true');store.setItem(chaves[2],'{"pipa":9}');
 const initial=JSON.stringify(criarBackup(store));const set=store.setItem;let thrown=false;
 store.setItem=(key,value)=>{if(key===chaves[1]&&!thrown){thrown=true;throw Error('quota');}set(key,value);};
 const incoming=criarBackup(memoria());incoming.dados[chaves[0]]='false';incoming.dados[chaves[1]]='null';
 assert.throws(()=>importarBackup(store,incoming));assert.equal(JSON.stringify(criarBackup(store)),initial);
});
test('recorde da lagartixa viaja no backup sem perder recordes anteriores',()=>{
 const origem=memoria(),destino=memoria();
 origem.setItem(chaves[2],JSON.stringify({luz:14,pao:7}));destino.setItem(chaves[2],JSON.stringify({pisca:8,luz:19}));
 importarBackup(destino,validarBackup(JSON.stringify(criarBackup(origem))));
 assert.deepEqual(JSON.parse(destino.getItem(chaves[2])),{pisca:8,luz:19,pao:7});
});

test('volumes viajam no schema 3 e backup antigo não os apaga',()=>{
 const a=memoria(),b=memoria();a.setItem(chaves[3],'35');a.setItem(chaves[4],'0');
 importarBackup(b,criarBackup(a));assert.equal(b.getItem(chaves[3]),'35');assert.equal(b.getItem(chaves[4]),'0');
 importarBackup(b,{aplicacao:'Miudezas',versao:2,dados:{[chaves[0]]:'false',[chaves[1]]:null,[chaves[2]]:null}});
 assert.equal(b.getItem(chaves[3]),'35');
 const ruim=criarBackup(a);ruim.dados[chaves[3]]='101';assert.throws(()=>validarBackup(JSON.stringify(ruim)));
});
