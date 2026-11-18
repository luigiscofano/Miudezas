# Ferramentas de manutenção

`node scripts/gerar-miniaturas.mjs` atualiza somente os dois SVGs legados de Peteca e Gato na Sombra em `dist/arte/`. Esses jogos estão fora do catálogo ativo. O script chama draw(ctx) das fábricas com um contexto que registra retângulos e produz SVGs. Não requer dependências externas. Use apenas para manutenção histórica de `pracinha.js`. O script não gera as dez miniaturas PNG ativas, os ícones SVG aprovados, a capa ou a marca; não o trate como pipeline de todo o acervo.

[Manual principal](../README.md)

