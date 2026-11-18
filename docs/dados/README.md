# Dados, recordes e compatibilidade

O backup versão **3** acrescenta volumes independentes `miudezas.v1.volumeMusica` e `miudezas.v1.volumeEfeitos` (inteiros 0–100, padrões10/25). Versões 1 e 2 continuam aceitas; importar arquivo antigo não apaga os volumes atuais. O mute legado permanece em `miudezas.v1.som`. Valores inválidos são rejeitados antes de alterar dados.


O backup versão **2** acrescenta `miudezas.v1.recordes` às preferências de som e ao progresso da volta. O prefixo de armazenamento continua `v1` para preservar as chaves existentes; a versão do arquivo exportado é independente dele.

Recordes têm formato `{ "pipa": 12, "pisca": 8 }`. Somente Goteira, Pipa, Fio, Pão, Pisca e Luz de Varanda (`luz`) são aceitos, com inteiros seguros não negativos. `normalizarRecordes` descarta campos inválidos ao ler dados locais; `validarRecordes` rejeita arquivos de backup inválidos. `registrarRecorde` não altera o objeto original e retorna a mesma referência em empates, valores menores ou entrada inválida.

A importação valida o arquivo inteiro antes de gravar. Arquivos versão 1 continuam aceitos e não apagam recordes locais. Ao importar recordes versão 2, conserva-se o maior resultado de cada jogo. Um campo de recordes nulo também não elimina resultados locais. Há cópia anterior ao processo e tentativa de restauração se uma escrita falhar. Limitações do navegador, como quota totalmente indisponível, ainda podem impedir a própria restauração; a cópia anterior não substitui exportações externas regulares.

Testes: `node --test tests/backup.test.mjs tests/recordes.test.mjs`. Cobrem migração v1, exportação v2, mesclagem por máximo, valores inválidos, empates e rollback de falha simulada. Nenhum serviço externo ou cadastro é utilizado.


Luz usa mosquitos capturados como recorde, não quantidade de tentativas ou tempo sobrevivido. Os arquivos versão 2 anteriores à inclusão de Luz continuam válidos: um objeto não precisa conter todos os seis IDs. A navegação **Voltar às fases** encerra a sessão corrente sem apagar recordes, backups ou progresso da volta; não deve inventar um resultado de derrota. A escolha de fase permanece na interface, sem prometer retomada do estado físico exato da partida após fechar o navegador.
