import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogo} from '../dist/catalogo.js';

test('Nomes das fases do quintal preservam IDs e ordem de dificuldade', () => {
  assert.deepEqual(catalogo.find(jogo => jogo.id === 'goteira').niveis,
    ['Chuvisco', 'Chuva firme', 'Temporal']);
  assert.deepEqual(catalogo.find(jogo => jogo.id === 'fio').niveis,
    ['Brisa', 'Ventania', 'Vendavau']);
});
