# Ícones aprovados da seleção

Estes quatro desenhos substituem somente as miniaturas correspondentes na galeria de jogos. Luz de Varanda foi adicionada após aprovação específica da opção A com ajuste restrito a uma perna.

| Arquivo | Jogo | Referência |
|---|---|---|
| `radio.svg` | Rádio de Pilha | Ícone aprovado na rodada 3 |
| `gude.svg` | Três Petelecos | Ícone aprovado na rodada 3 |
| `pisca.svg` | Pisca no Mato | Vaga-lume original, preservado na rodada 3 |
| `luz.svg` | Luz de Varanda | Opção A com perna esquerda afastada; cauda, rosto e luz preservados |

![Rádio](radio.svg) ![Bolinha](gude.svg) ![Vaga-lume](pisca.svg) ![Lagartixa](luz.svg)

## Construção e enquadramento

As artes aprovadas usam uma matriz de 48 × 48 pixels. Os SVGs representam os mesmos pixels por retângulos horizontais contíguos, sem filtros, scripts, fontes ou dependências externas. `shape-rendering="crispEdges"` mantém as bordas secas. O `viewBox` 72 × 56 adiciona apenas margem de fundo em volta da matriz (12 pixels na horizontal e 4 na vertical), preservando a composição central da prévia nos cartões.

## Integração restrita

`catalogo.js` informa o caminho opcional `icone`. `app.js` só pede esse asset ao montar `galeria()`. As introduções, o roteiro e os resultados continuam lendo as miniaturas anteriores. Nenhuma regra, controle, recorde, conquista ou backup foi modificado. Novos ícones dependem de aprovação individual antes de alterar o catálogo.

## Verificação

O teste de navegação confere os dez cartões e a preservação das imagens fora da galeria. A rasterização local foi comparada pixel a pixel com os PNGs aprovados. Testes automatizados não substituem revisão em dispositivos físicos.
