// A mesma matriz define a arte e os pixels sólidos: o interior do V continua livre.
export const spriteAvePipa = ['k.....k', '.kk.kk.', '..kwk..', '...k...'];
const pixelsAve = spriteAvePipa.flatMap((linha, y) => [...linha].flatMap((pixel, x) => pixel === '.' ? [] : [{x, y}]));
export const coresAvePipa = {k: '#354b50', w: '#f4e4b1'};

export function criarBandoPipa(pontaY) {
  if (pontaY === null) return [];
  const fileiras = Math.max(2, Math.min(5, Math.floor(pontaY / 6) + 1));
  const aves = [{x: -3, y: pontaY}];
  for (let par = 1; par < fileiras; par++) {
    const y = pontaY - par * 6;
    aves.push({x: -3 - par * 7, y}, {x: -3 + par * 7, y});
  }
  return aves;
}

export function colideBandoPipa(aves, posteX, pipaX, pipaY) {
  // Coordenadas inteiras acompanham o desenho. O corpo da pipa é um losango de raio 4.
  const origemX = Math.round(posteX), centroY = Math.round(pipaY);
  return aves.some(ave => {
    const x = origemX + ave.x;
    if (x > pipaX + 4 || x + 6 < pipaX - 4 || ave.y > centroY + 4 || ave.y + 3 < centroY - 4) return false;
    return pixelsAve.some(pixel =>
      Math.abs(x + pixel.x - pipaX) + Math.abs(ave.y + pixel.y - centroY) <= 4
    );
  });
}
