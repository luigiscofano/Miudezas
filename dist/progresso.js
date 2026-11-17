// A ordem legada é necessária para não atribuir uma vitória a outro jogo.
const idsLegados = ['goteira','mare','fio','pipa','radio','pao','balsa','rastro','luz','gude','pratos','pisca','peteca','sombra','pescaria','piao'];

export function normalizarVolta(volta, idsAtuais) {
  if (!volta || ![1,2,3].includes(volta.nivel) ||
      !Array.isArray(volta.resultados) ||
      !volta.resultados.every(resultado => typeof resultado === 'boolean')) return null;
  const origem = volta.ids ?? idsLegados;
  if (!Array.isArray(origem) || new Set(origem).size !== origem.length ||
      !origem.every(id => typeof id === 'string') ||
      volta.resultados.length >= origem.length) return null;
  const concluidos = new Map(origem.slice(0, volta.resultados.length)
    .map((id, indice) => [id, volta.resultados[indice]]));
  const resultados = [];
  for (const id of idsAtuais) {
    if (!concluidos.has(id)) break;
    resultados.push(concluidos.get(id));
  }
  if (resultados.length === idsAtuais.length) return null;
  return {nivel: volta.nivel, ids: [...idsAtuais], resultados};
}
