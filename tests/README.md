# Testes de comportamento

Execute `node --test tests/*.test.mjs` na raiz, com Node moderno. Sem pacotes externos.

- pracinha.test.mjs verifica os três níveis, metas alcançáveis em diferentes taxas de quadros, derrotas, resultado único e cancelamento de entrada. As estratégias observam o desenho público, sem acessar variáveis internas das fábricas.
- navegacao.test.mjs verifica a paginação, a compatibilidade do progresso salvo e a transição até a 12ª parada usando um ambiente de navegação simulado.

Os testes não substituem a inspeção visual nem o teste de toque em aparelhos reais.

[Manual principal](../README.md)


- capa.test.mjs verifica dimensões do PNG, preservação da proporção e título acessível sem sobreposição.

- pao.test.mjs verifica os três ritmos em 30/60/120 atualizações por segundo, identidades permanentes, alternância, seleções, reposições, queima única, utensílio errado, derrota no terceiro erro, vitória, bloqueio após término e reinício limpo.
