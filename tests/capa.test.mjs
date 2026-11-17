import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// O arquivo aprovado deve continuar íntegro e a abertura não pode esticá-lo.
test('Capa aprovada existe nas dimensões originais', () => {
  const imagem=readFileSync(new URL('../dist/artes/capas/miudezas-tijuca.png',import.meta.url));
  assert.equal(imagem.subarray(1,4).toString(),'PNG');
  assert.equal(imagem.readUInt32BE(16),1672);
  assert.equal(imagem.readUInt32BE(20),941);
});
test('Abertura preserva composição e título acessível', () => {
  const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
  const css=readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');
  assert.match(app,/artes\/capas\/miudezas-tijuca\.png/);
  assert.match(app,/<h1 class="sr-only">Miudezas/);
  assert.doesNotMatch(app,/class="brand"/);
  assert.match(css,/\.hero img\{[^}]*object-fit:contain/);
});
