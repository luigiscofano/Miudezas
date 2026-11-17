# Migração para GitHub Pages

## Estado e publicação

O pacote estático é **exatamente `dist/`**, sem compilação e sem backend. O workflow `.github/workflows/pages.yml` testa o projeto antes de enviar essa pasta ao Pages. Ele é manual para que uma alteração na branch não publique conteúdo sem revisão.

1. Em **Settings → Pages**, selecione **GitHub Actions** como origem.
2. Em **Actions → Publicar Miudezas no GitHub Pages → Run workflow**, escolha `main`.
3. Confira o sucesso do job e abra a URL devolvida pelo deployment. O endereço esperado é `https://luigiscofano.github.io/Miudezas/`; só considerá-lo publicado após a verificação.
4. Depois de cada atualização aprovada/integrada, execute o mesmo workflow. Reversão: reverta o commit por PR e publique novamente.

A publicação Pages é pública; repositórios privados precisam de um plano elegível. O proprietário autorizou tornar este repositório público se necessário para migrar. Não há credenciais, banco ou documentos de usuários no pacote. O arquivo `.openai/hosting.json` registra somente a associação com a antiga hospedagem, não uma credencial, e não faz parte do artefato Pages.

## Preservação de visual e funcionalidades

Não foi reescrito nenhum jogo, estilo, regra ou mecanismo de navegação. Fontes e imagens são locais. Os caminhos `./` funcionam tanto na raiz antiga quanto no prefixo `/Miudezas/`. A janela de jogo usa a URL atual e conserva esse prefixo; o bloqueio de popup tem fallback na página. Som sintetizado, Canvas e módulos JavaScript continuam executados no navegador. Não há serviço de servidor a substituir.

O endereço antigo deve permanecer disponível como cópia de segurança. Não remover a antiga publicação para forçar a migração.

## Transferência de progresso

`localStorage` pertence à origem do site. O navegador não permite ao Pages ler diretamente os dados do endereço antigo. Portanto, **não há migração automática** e abrir o novo endereço inicialmente não recupera a volta antiga.

1. No navegador em que jogava, saia da partida e volte ao menu.
2. Abra `https://miudezas-de-luigi.luigiscofano.chatgpt.site/backup.html` e baixe `Miudezas-progresso.json` (essa página precisa estar publicada também no endereço antigo).
3. Feche outras abas do Miudezas para evitar gravações concorrentes.
4. Abra `https://luigiscofano.github.io/Miudezas/backup.html` e importe o arquivo. Confirme a substituição somente no endereço de destino.
5. Volte ao jogo e confira a retomada da volta e o som.

São transferidos apenas os dados que o jogo já salva: volta em andamento e preferência de som. Uma partida em execução não é serializada pelo jogo. O arquivo é processado localmente, sem upload para servidor. A importação valida formato e limite de 100 KB; antes de substituir dados salva uma cópia em `miudezas.backup.anterior`. O original no endereço antigo não é removido nem modificado. A chave anterior pode ser extraída pelas ferramentas do navegador se precisar recuperar uma importação equivocada; conservar também o arquivo exportado.

Limpar dados do navegador, usar navegação privada ou mudar de aparelho pode perder o armazenamento local. Guarde o JSON para backup. Não há conta nem sincronização.

## Verificações

Execute `node --test tests/*.test.mjs`. Os testes cobrem jogos, navegação, arte e ida/volta de backup; não substituem jogar no endereço publicado nem validar toque em aparelhos reais. Após a publicação confira capa, marca, seleção de todos os 12 jogos, popup, som, retomada e importação/exportação. Teste também recarregar uma URL com `?janela=1` e o caminho `/Miudezas/`.

[README principal](../README.md) · [Documentação](README.md)
