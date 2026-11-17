# Testes de comportamento

Execute `node --test tests/*.test.mjs` na raiz, com Node moderno. Sem pacotes externos.

- pracinha.test.mjs verifica os três níveis, metas alcançáveis em diferentes taxas de quadros, derrotas, pescaria sem cronômetro, resultado único e cancelamento de entrada. As estratégias observam o desenho público, sem acessar variáveis internas das fábricas.
- navegacao.test.mjs verifica a paginação, a compatibilidade do progresso salvo e a transição até a 16ª parada usando um ambiente de navegação simulado.

Os testes não substituem a inspeção visual nem o teste de toque em aparelhos reais.

[Manual principal](../README.md)
