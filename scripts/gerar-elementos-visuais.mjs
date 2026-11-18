import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {catalogo} from '../dist/catalogo.js';
import {quintal} from '../dist/quintal.js';
import {esquina} from '../dist/esquina.js';
import {varanda} from '../dist/varanda.js';
import {criarRegistro, instantes} from './gerar-cenas-atuais.mjs';
import {inventario} from './inventario-elementos.mjs';
const fabricas = {...quintal,...esquina,...varanda};
const escapar = texto => String(texto).replaceAll('&','&amp;').replaceAll('<','&lt;');

export async function extrairElementos(id) {
 const ficha = inventario[id];
 if (!ficha) throw new Error(`Jogo não inventariado: ${id}`);
 const fonte = await readFile(new URL(`../dist/${ficha.modulo}.js`,import.meta.url),'utf8');
 const jogo = fabricas[id](3,{tone(){},finish(){}},{seed:20261118});
 for(let q=0;q<Math.round(instantes[id]*60);q++) jogo.update(1/60);
 // O rastro e a mira só existem depois de uma entrada válida do jogador.
 if(id==='rastro') {
  const estado=jogo.snapshot(), lado=estado.mapa.length, pos=estado.caminho.at(-1);
  const x=pos%lado,y=Math.floor(pos/lado);
  const vizinhos=[['right',x+1,y],['down',x,y+1],['left',x-1,y],['up',x,y-1]];
  const candidato=vizinhos.find(([,nx,ny])=>nx>=0&&ny>=0&&nx<lado&&ny<lado&&!['#','P'].includes(estado.mapa[ny][nx]));
  if(candidato){jogo.press(candidato[0]);jogo.release(candidato[0]);}
 }
 if(id==='gude'){jogo.press('up');jogo.update(.25);}
 const codigo = jogo.draw.toString(), inicio=fonte.indexOf(codigo);
 if(inicio<0) throw new Error(`Não foi possível localizar draw() de ${id}`);
 const primeira=fonte.slice(0,inicio).split('\n').length;
 const ultima=primeira+codigo.split('\n').length-1;
 const grupos=ficha.grupos.map(([slug,nome,marco])=>{
  const indice=codigo.indexOf(marco);
  if(indice<0) throw new Error(`Marco ausente em ${id}/${slug}: ${marco}`);
  return {slug,nome,linha:primeira+codigo.slice(0,indice).split('\n').length-1,formas:[]};
 });
 for(let i=1;i<grupos.length;i++) if(grupos[i].linha<grupos[i-1].linha) throw new Error(`Marcos fora de ordem: ${id}`);
 const ctx=criarRegistro(), registrar=ctx.fillRect.bind(ctx);
 let semGrupo=0;
 const limiteAnterior=Error.stackTraceLimit;
 // Instrumentação exclusivamente documental. Nenhum arquivo do jogo é alterado.
 // A pilha associa cada retângulo ao bloco real de draw() que o emitiu.
 Error.stackTraceLimit=40;
 ctx.fillRect=(...args)=>{
  registrar(...args);
  const linhas=[...new Error().stack.matchAll(new RegExp(`/${ficha.modulo}\\.js:(\\d+):\\d+`,'g'))]
   .map(m=>Number(m[1])).filter(l=>l>=primeira&&l<=ultima);
  const linha=Math.max(...linhas);
  const grupo=grupos.findLast(g=>g.linha<=linha);
  if(!grupo){semGrupo++;return;}
  grupo.formas.push(ctx.formas.at(-1));
 };
 try{jogo.draw(ctx);}finally{Error.stackTraceLimit=limiteAnterior;}
 if(semGrupo) throw new Error(`${id}: ${semGrupo} formas sem inventário`);
 return {grupos,total:ctx.formas.length,fonte:`dist/${ficha.modulo}.js`};
}
export function svgElemento(grupo) {
 if(!grupo.formas.length) throw new Error(`Grupo sem representação: ${grupo.slug}`);
 const caixas=grupo.formas.map(f=>Object.fromEntries([...f.matchAll(/(x|y|width|height)="([\d.e+-]+)"/g)].map(m=>[m[1],Number(m[2])])));
 const x=Math.floor(Math.min(...caixas.map(r=>r.x)))-2,y=Math.floor(Math.min(...caixas.map(r=>r.y)))-2;
 const w=Math.ceil(Math.max(...caixas.map(r=>r.x+r.width)))-x+2,h=Math.ceil(Math.max(...caixas.map(r=>r.y+r.height)))-y+2;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w*4}" height="${h*4}" shape-rendering="crispEdges" role="img"><title>${escapar(grupo.nome)}</title><desc>Elementos extraídos das chamadas reais de draw(). Fundo transparente; posições relativas e cores preservadas.</desc>${grupo.formas.join('')}</svg>\n`;
}
export function pranchaElementos(grupos, nome) {
 const colunas=3, largura=600, altura=Math.ceil(grupos.length/colunas)*160;
 const itens=grupos.map((grupo,i)=>{
  const svg=svgElemento(grupo), viewBox=svg.match(/viewBox="([^"]+)"/)[1];
  const x=(i%colunas)*200,y=Math.floor(i/colunas)*160;
  return `<rect x="${x+3}" y="${y+3}" width="194" height="154" fill="#eeeae1" stroke="#c5beb0"/><svg x="${x+15}" y="${y+12}" width="170" height="112" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet" shape-rendering="crispEdges">${grupo.formas.join('')}</svg><text x="${x+100}" y="${y+145}" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#2e3535">${escapar(grupo.slug)}</text>`;
 }).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largura} ${altura}" role="img"><title>${escapar(nome)} — elementos reais do jogo</title><desc>Prancha documental com fundos neutros e legendas; cada quadro contém chamadas reais de desenho, com ampliação própria.</desc>${itens}</svg>\n`;
}
export async function gerar() {
 const raiz=new URL('../docs/elementos-visuais/',import.meta.url);
 await mkdir(raiz,{recursive:true});
 const indice=[];
 for(const {id,nome} of catalogo){
  const resultado=await extrairElementos(id),pasta=new URL(`${id}/`,raiz);await mkdir(pasta,{recursive:true});
  let texto=`# Elementos de ${nome}\n\n[Índice do acervo](../README.md) · [Código de desenho](../../../${resultado.fonte})\n\nExtração dos blocos reais de \`draw()\`, nível Puxado, semente \`20261118\`. Elementos agrupados por função, não ícones da seleção. As coordenadas relativas são preservadas; por isso conjuntos como folhas e pedras mantêm o espaçamento do tabuleiro. Fundo transparente.\n\n`;
  for(const grupo of resultado.grupos){
   await writeFile(new URL(`${grupo.slug}.svg`,pasta),svgElemento(grupo));
   texto+=`## ${grupo.nome}\n\n<img src="${grupo.slug}.svg" width="288" alt="${grupo.nome}, desenho real do jogo">\n\n`;
  }
  await writeFile(new URL('prancha.svg',pasta),pranchaElementos(resultado.grupos,nome));
  await writeFile(new URL('README.md',pasta),texto);
  indice.push({id,nome,grupos:resultado.grupos.map(g=>({id:g.slug,nome:g.nome,retangulos:g.formas.length})),retangulos:resultado.total,fonte:resultado.fonte});
 }
 await writeFile(new URL('inventario.json',raiz),JSON.stringify(indice,null,2)+'\n');
 console.log(`${indice.length} jogos e ${indice.reduce((n,j)=>n+j.grupos.length,0)} famílias visuais extraídas.`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) await gerar();
