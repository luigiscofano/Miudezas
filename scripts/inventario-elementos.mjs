// Os marcos apontam para blocos reais de draw(); não duplicam matrizes ou paletas.
// Cada grupo reúne uma família visual. Estados animados continuam no motor.
export const inventario = {
 goteira: {modulo:'quintal', grupos:[
 ['teto','Teto e rachaduras','rect(ctx, ink, 0, 0, 96, 96);'],
 ['janela-parede','Janela e marcas da parede',"rect(ctx, '#253650', 6, 34, 23, 22);"],
 ['chao-ralo','Piso, ralo e água no chão','rect(ctx, wall, 0, 88, 96, 3);'],
 ['gotas','Gotas e respingos','for (const d of drops) {'],
 ['balde','Balde, alça e conteúdo','const by = bounce > 0 ? 80 : 79;']
 ]},
 mare:{modulo:'quintal',grupos:[
 ['terreno','Mar, areia, espuma, ondulações e travessias','for (let j = 0; j < 8; j++)'],
 ['pedras','Pedras e sombras',"if (at === '#') {"],
 ['concha','Concha de destino',"if (at === 'C') {"],
 ['siri','Siri / caranguejo','sprite(ctx, crab,']
 ]},
 fio:{modulo:'quintal',grupos:[
 ['ceu-nuvens','Céu e nuvens',"const ink = '#352d32'"],
 ['casario','Casas, telhados e chaminé',"rect(ctx, '#d98a71', 18, 89, 13, 7);"],
 ['fios-rajada','Fios e sinal de rajada','wires.forEach((height, r) => {'],
 ['mariposa','Mariposa','const [mx, my] = moths[target];'],
 ['bem-te-vi','Bem-te-vi','sprite(ctx, bird,']
 ]},
 pipa:{modulo:'quintal',grupos:[
 ['ceu-nuvens','Céu e nuvens',"const sky = '#7fd5d1'"],
 ['morros','Duas camadas de morros','for(let hx=0;hx<96;hx++)'],
 ['casario','Fachadas, janelas, portas e telhados','let bx = -Math.floor(scroll * 0.65)'],
 ['poste-laje','Postes e lajes','for (const tower of towers) {'],
 ['aves','Bando de aves em V','for (const ave of tower.aves) {'],
 ['pipa-linha','Pipa, linha, rabiola e laços','const topY = Math.round(y);']
 ]},
 radio:{modulo:'esquina',grupos:[
 ['ambiente','Parede e bancada','const plum ='],
 ['antena-caixa','Antena, caixa e acabamento','for (let s = 0; s < 13; s++)'],
 ['visor','Escala, ponteiro e luz de sintonia','rect(ctx, ivory, 18, 40, 60, 11);'],
 ['alto-falante','Grade do alto-falante','for (let k = 0; k < 4; k++)'],
 ['sintonizador','Botão e marcadores das estações','rect(ctx, ivory, 62, 56, 6, 1);']
 ]},
 pao:{modulo:'esquina',grupos:[
 ['chapa','Chapa, alça, bordas e fundo',"const iron = '#242034'"],
 ['ovo','Ovo: clara, gema e brilho',"if (alimento.tipo === 'ovo') {"],
 ['pao-frances','Pão francês e cortes da casca','const paletasPao = ['],
 ['vapor','Vapor dos alimentos','if (state > 0) {'],
 ['utensilios','Espátula, pinça e seleção','for (let i = 0; i < 2; i++) {']
 ]},
 rastro:{modulo:'esquina',grupos:[
 ['ladrilhos','Ladrilhos e acabamento','const size = Math.floor(94 / side)'],
 ['folhas','Três folhas com desenhos diferentes',"if (tiles[i] === 'L'"],
 ['pedras','Pedras',"if (tiles[i] === '#')"],
 ['pote','Pote de destino',"if (tiles[i] === 'P') {"],
 ['rastro','Rastro construído','for (let i = 1; i < path.length; i++)'],
 ['caracol','Caracol e concha','const pos = path[path.length - 1]']
 ]},
 luz:{modulo:'varanda',grupos:[
 ['parede','Parede, relevo e rodapé',"fundo(ctx, '#33245e');"],
 ['lampada','Lâmpada, fio e sinais de luz','const tempoRestante ='],
 ['mosquito','Mosquito e asas','if (!bote || !bote.acerto'],
 ['lagartixa','Lagartixa: corpo, membros, cauda e olhos','if (bote) {']
 ]},
 gude:{modulo:'varanda',grupos:[
 ['chao','Terra batida, grãos e vegetação',"fundo(ctx,'#ca733d');"],
 ['buraco','Buraco de destino','const [a,b]=alvo;'],
 ['pedras','Pedras e sombras','for (const [px,py,w,h] of terreno.pedras)'],
 ['mira','Mira e indicação de alcance','let vec,dist;'],
 ['bolinha','Bolinha de gude, brilho e sombra',"bloco(ctx,x-2,y+3,6,2,'#a95130');"]
 ]},
 pisca:{modulo:'varanda',grupos:[
 ['mato','Fundo noturno e vegetação',"fundo(ctx,'#0b3439');"],
 ['vagalumes','Vagalumes, asas, abdômen e sinais de luz',"for(const [dir,x] of [['left',16],['right',62]]){"]
 ]}
};
