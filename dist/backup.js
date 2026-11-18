import {validarRecordes, normalizarRecordes} from './recordes.js';

// Exportação explícita: os navegadores isolam os dados de cada endereço.
export const chaves = ['miudezas.v1.som', 'miudezas.v1.volta', 'miudezas.v1.recordes', 'miudezas.v1.volumeMusica', 'miudezas.v1.volumeEfeitos'];
export function criarBackup(armazenamento) {
  return {aplicacao: 'Miudezas', versao: 3, dados: Object.fromEntries(
    chaves.map(chave => [chave, armazenamento.getItem(chave)]))};
}
export function validarBackup(texto) {
  if (texto.length > 100000) throw new Error('Arquivo maior que o limite de 100 KB.');
  const backup = JSON.parse(texto);
  if (!backup || backup.aplicacao !== 'Miudezas' || ![1, 2, 3].includes(backup.versao) || !backup.dados || typeof backup.dados !== 'object' || Array.isArray(backup.dados) ||
      Object.keys(backup.dados).some(chave => !chaves.includes(chave))) {
    throw new Error('Este arquivo não é um backup compatível do Miudezas.');
  }
  for (const chave of chaves) {
    const bruto = backup.dados[chave];
    if (backup.versao === 1 && chave.endsWith('.recordes') && bruto === undefined) continue;
    if (backup.versao < 3 && chave.includes('.volume') && bruto === undefined) continue;
    if (bruto === null) continue;
    if (typeof bruto !== 'string') throw new Error('Backup incompleto.');
    const valor = JSON.parse(bruto);
    if (chave.includes('.volume') && (!Number.isInteger(valor) || valor < 0 || valor > 100)) throw new Error('Volume inválido.');
    if (chave.endsWith('.recordes') && !validarRecordes(valor)) throw new Error('Recordes inválidos.');
    if (chave.endsWith('.som') && typeof valor !== 'boolean') throw new Error('Preferência de som inválida.');
    if (chave.endsWith('.volta') && valor !== null &&
        (!valor || ![1,2,3].includes(valor.nivel) || !Array.isArray(valor.resultados) ||
         valor.resultados.length > 16 || !valor.resultados.every(item => typeof item === 'boolean') ||
         (valor.ids !== undefined && (!Array.isArray(valor.ids) || valor.ids.length > 16 ||
          !valor.ids.every(id => typeof id === 'string') || new Set(valor.ids).size !== valor.ids.length)))) {
      throw new Error('Progresso inválido.');
    }
  }
  return backup;
}
export function importarBackup(armazenamento, backup) {
  backup = validarBackup(JSON.stringify(backup));
  // Registra uma cópia antes de qualquer alteração, para permitir recuperação.
  armazenamento.setItem('miudezas.backup.anterior', JSON.stringify(criarBackup(armazenamento)));
  const anterior = criarBackup(armazenamento);
  try {
    for (const chave of chaves) {
      if (chave.includes('.volume') && backup.dados[chave] === undefined) continue;
      // Importar um arquivo antigo nunca elimina recordes conquistados depois.
      if (chave.endsWith('.recordes')) {
        if (backup.dados[chave] == null) continue;
        let existentes = {};
        try { existentes = normalizarRecordes(JSON.parse(armazenamento.getItem(chave))); } catch {}
        const recebidos = JSON.parse(backup.dados[chave]);
        for (const [id, pontos] of Object.entries(recebidos)) existentes[id] = Math.max(existentes[id] ?? 0, pontos);
        armazenamento.setItem(chave, JSON.stringify(existentes));
        continue;
      }
      if (backup.dados[chave] === null) armazenamento.removeItem(chave);
      else armazenamento.setItem(chave, backup.dados[chave]);
    }
  } catch (erro) {
    for (const chave of chaves) {
      if (anterior.dados[chave] === null) armazenamento.removeItem(chave);
      else armazenamento.setItem(chave, anterior.dados[chave]);
    }
    throw erro;
  }
}
