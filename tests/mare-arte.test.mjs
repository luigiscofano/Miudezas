import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quintal} from '../dist/quintal.js';

test('Maré: arte cabe na célula e desenhar preserva o estado', () => {
  const game = quintal.mare(1, {tone() {}, finish() {}});
  const before = game.snapshot();
  const pixels = new Map();
  const ctx = {fillStyle: '', fillRect(x, y, w, h) {
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) pixels.set(`${x + dx},${y + dy}`, this.fillStyle);
  }};
  game.draw(ctx);
  const rows = ['r.r.....r.r','rrr.w.w.rrr','.r..k.k..r.','..rrrrrrr..','.rrhhhhhrr.','..rrrrrrr..','.r.rrrrr.r.','r.r.....r.r'];
  const palette = {r: '#cd4c3e', w: '#fff4c9', k: '#323b43', h: '#ec8162'};
  rows.forEach((row, dy) => [...row].forEach((key, dx) => {
    if (palette[key]) assert.equal(pixels.get(`${before.x * 12 + dx},${before.y * 12 + 2 + dy}`), palette[key]);
  }));
  assert.deepEqual(game.snapshot(), before);
  assert.ok(rows.every(row => row.length <= 12));
  assert.ok(rows.length + 2 <= 12);
});
