import {writeFile} from 'node:fs/promises';
import {pracinha} from '../dist/pracinha.js';

// As miniaturas usam o próprio desenho jogável, sem manter um segundo sprite.
for (const [id, criar] of Object.entries(pracinha)) {
  const retangulos = [];
  const contexto = {
    fillStyle: '',
    fillRect(x, y, largura, altura) {
      retangulos.push(`<rect x="${x}" y="${y}" width="${largura}" height="${altura}" fill="${this.fillStyle}"/>`);
    }
  };
  criar(1, {tone() {}, finish() {}}).draw(contexto);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" shape-rendering="crispEdges">${retangulos.join('')}</svg>\n`;
  await writeFile(new URL(`../dist/arte/${id}.svg`, import.meta.url), svg);
}
console.log('Quatro miniaturas atualizadas a partir das cenas jogáveis.');
