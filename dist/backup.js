// Exportação explícita: os navegadores isolam os dados de cada endereço.
export const chaves = ['miudezas.v1.som', 'miudezas.v1.volta'];
export function criarBackup(armazenamento) {
  return {aplicacao: 'Miudezas', versao: 1, dados: Object.fromEntries(
    chaves.map(chave => [chave, armazenamento.getItem(chave)]))};
}
export function validarBackup(texto) {
  if (texto.length > 100000) throw new Error('Arquivo maior que o limite de 100 KB.');
  const backup = JSON.parse(texto);
  if (backup.aplicacao !== 'Miudezas' || backup.versao !== 1 || !backup.dados ||
      Object.keys(backup.dados).some(chave => !chaves.includes(chave))) {
    throw new Error('Este arquivo não é um backup compatível do Miudezas.');
  }
  for (const chave of chaves) {
    const bruto = backup.dados[chave];
    if (bruto === null) continue;
    if (typeof bruto !== 'string') throw new Error('Backup incompleto.');
    const valor = JSON.parse(bruto);
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
  // Registra uma cópia antes de qualquer alteração, para permitir recuperação.
  armazenamento.setItem('miudezas.backup.anterior', JSON.stringify(criarBackup(armazenamento)));
  const anterior = criarBackup(armazenamento);
  try {
    for (const chave of chaves) {
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
