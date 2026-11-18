# Ferramentas de manutenção

`node scripts/gerar-miniaturas.mjs` atualiza somente os dois SVGs legados de Peteca e Gato na Sombra em `dist/arte/`. Esses jogos estão fora do catálogo ativo. O script chama draw(ctx) das fábricas com um contexto que registra retângulos e produz SVGs. Não requer dependências externas. Use apenas para manutenção histórica de `pracinha.js`. O script não gera as dez miniaturas PNG ativas, os ícones SVG aprovados, a capa ou a marca; não o trate como pipeline de todo o acervo.

[Manual principal](../README.md)


## Cenas atuais dos dez jogos

Execute `node scripts/gerar-cenas-atuais.mjs` na raiz. O script usa as fábricas e o método `draw()` de cada jogo para exportar os tabuleiros de Puxado em SVG, sem dependências externas, cursor ou redesenho. A simulação usa passo fixo e semente conhecida. Os arquivos ficam em `docs/imagens/jogos/`, fora dos arquivos publicados em `dist/`. Não são capturas da interface completa. Veja [origem, escolhas e reprodução](../docs/imagens/jogos/README.md).

## Acervo de elementos visuais

`node scripts/gerar-elementos-visuais.mjs` extrai as 47 famílias reais dos dez jogos. `inventario-elementos.mjs` define os marcos de origem. A ferramenta roda somente para documentação, não no navegador. Consulte [procedência e limites](../docs/elementos-visuais/README.md).

## Áudio

[Composição e exportação reproduzível](audio/README.md), com nove músicas, nove efeitos e gerador de formas de onda/mapas de notas.
