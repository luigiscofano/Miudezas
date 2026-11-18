import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {catalogo} from '../dist/catalogo.js';
import {criarRegistro, renderizarCena} from '../scripts/gerar-cenas-atuais.mjs';

for (const {id} of catalogo) test(`Cena documentada de ${id} acompanha o desenho atual`, async () => {
  const arquivo = await readFile(new URL(`../docs/imagens/jogos/${id}.svg`, import.meta.url), 'utf8');
  assert.equal(arquivo, renderizarCena(id));
  assert.equal(renderizarCena(id), renderizarCena(id), 'a imagem precisa ser reproduzível');
  assert.match(arquivo, /viewBox="0 0 96 96"/);
});
test('Registro mantém espelhamento e restaura a transformação do caracol', () => {
  const ctx = criarRegistro();
  ctx.fillStyle = '#ffffff'; ctx.save(); ctx.translate(20,10); ctx.scale(-1,1); ctx.fillRect(2,3,4,5); ctx.restore(); ctx.fillRect(2,3,4,5);
  assert.match(ctx.formas[0], /x="14" y="13" width="4" height="5"/);
  assert.match(ctx.formas[1], /x="2" y="3"/);
  assert.throws(() => ctx.restore());
});
