// Recordes independentes das dificuldades autorais e sem dados pessoais.
export const idsRecordes = Object.freeze(['goteira', 'pipa', 'fio', 'pao', 'pisca', 'luz']);
const objeto = valor => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const pontuacaoValida = valor => Number.isSafeInteger(valor) && valor >= 0;

export function validarRecordes(valor) {
  return objeto(valor) && Object.entries(valor).every(([id, pontos]) =>
    idsRecordes.includes(id) && pontuacaoValida(pontos));
}

export function normalizarRecordes(valor) {
  if (!objeto(valor)) return {};
  return Object.fromEntries(Object.entries(valor).filter(([id, pontos]) =>
    idsRecordes.includes(id) && pontuacaoValida(pontos)));
}

export function registrarRecorde(recordes, id, pontos) {
  // Não grava novamente empates: preserva referência e evita escrita desnecessária.
  if (!idsRecordes.includes(id) || !pontuacaoValida(pontos) || pontos <= (recordes?.[id] ?? 0)) return recordes;
  return {...normalizarRecordes(recordes), [id]: pontos};
}
