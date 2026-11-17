# Dados, recordes e compatibilidade

O backup versão **2** acrescenta `miudezas.v1.recordes` às preferências de som e ao progresso da volta. O prefixo de armazenamento continua `v1` para preservar as chaves existentes; a versão do arquivo exportado é independente dele.

Recordes têm formato `{ "pipa": 12, "pisca": 8 }`. Somente Goteira, Pipa, Fio, Pão e Pisca são aceitos, com inteiros seguros não negativos. `normalizarRecordes` descarta campos inválidos ao ler dados locais; `validarRecordes` rejeita arquivos de backup inválidos. `registrarRecorde` não altera o objeto original e retorna a mesma referência em empates, valores menores ou entrada inválida.

A importação valida o arquivo inteiro antes de gravar. Arquivos versão 1 continuam aceitos e não apagam recordes locais. Ao importar recordes versão 2, conserva-se o maior resultado de cada jogo. Um campo de recordes nulo também não elimina resultados locais. Há cópia anterior ao processo e tentativa de restauração se uma escrita falhar. Limitações do navegador, como quota totalmente indisponível, ainda podem impedir a própria restauração; a cópia anterior não substitui exportações externas regulares.

Testes: `node --test tests/backup.test.mjs tests/recordes.test.mjs`. Cobrem migração v1, exportação v2, mesclagem por máximo, valores inválidos, empates e rollback de falha simulada. Nenhum serviço externo ou cadastro é utilizado.
