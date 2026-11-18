import {mkdir, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {catalogo} from '../dist/catalogo.js';
import {quintal} from '../dist/quintal.js';
import {esquina} from '../dist/esquina.js';
import {varanda} from '../dist/varanda.js';

const fabricas = {...quintal, ...esquina, ...varanda};
export const instantes = {goteira:1.5, mare:0, fio:0.3, pipa:1.8, radio:0, pao:1.8, rastro:0, luz:0.3, gude:0, pisca:0.9};
const escapar = texto => String(texto).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

// Registra somente as operações de Canvas usadas pelas cenas atuais. Não redesenha
// os sprites: as próprias funções draw() produzem cada retângulo e transformação.
export function criarRegistro() {
  const formas = [];
  const pilha = [];
  let estado = {cor:'#000000', x:0, y:0, sx:1, sy:1};
  return {
    formas,
    get fillStyle() { return estado.cor; },
    set fillStyle(cor) { estado.cor = cor; },
    save() { pilha.push({...estado}); },
    restore() { if (!pilha.length) throw new Error('Transformação sem save correspondente'); estado = pilha.pop(); },
    translate(x, y) { estado.x += x * estado.sx; estado.y += y * estado.sy; },
    scale(x, y) { estado.sx *= x; estado.sy *= y; },
    fillRect(x, y, largura, altura) {
      const a = estado.x + x * estado.sx, b = estado.y + y * estado.sy;
      const w = largura * estado.sx, h = altura * estado.sy;
      formas.push(`<rect x="${Math.min(a,a+w)}" y="${Math.min(b,b+h)}" width="${Math.abs(w)}" height="${Math.abs(h)}" fill="${escapar(estado.cor)}"/>`);
    }
  };
}

export function renderizarCena(id) {
  const ficha = catalogo.find(jogo => jogo.id === id);
  if (!ficha) throw new Error(`Jogo desconhecido: ${id}`);
  let terminou = false;
  const jogo = fabricas[id](3, {tone() {}, finish() { terminou = true; }}, {seed:20261118});
  // Um passo fixo reproduz o mesmo quadro e respeita a atualização real do motor.
  for (let quadro = 0; quadro < Math.round(instantes[id] * 60); quadro++) jogo.update(1/60);
  if (terminou) throw new Error(`A cena ${id} precisa mostrar uma partida em andamento`);
  const contexto = criarRegistro();
  jogo.draw(contexto);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="384" height="384" shape-rendering="crispEdges" role="img"><title>${escapar(ficha.nome)} — cena atual, Puxado</title><desc>Renderização direta do Canvas jogável, sem cursor ou redesenho. ${escapar(jogo.hud())}</desc>${contexto.formas.join('')}</svg>\n`;
}

async function gerar() {
  const pasta = new URL('../docs/imagens/jogos/', import.meta.url);
  await mkdir(pasta, {recursive:true});
  for (const {id} of catalogo) await writeFile(new URL(`${id}.svg`, pasta), renderizarCena(id));
  console.log(`${catalogo.length} cenas atuais geradas a partir do motor, sem alterar dist/.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await gerar();
