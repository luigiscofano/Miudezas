# Design: arquivos, desenhos em código e aplicações

O acervo não é uma única pasta de sprites. Miudezas combina imagens estáticas, fonte local, SVGs de interface e desenho Canvas. Este catálogo distingue **o que está no disco** de **o que é desenhado durante a partida**, com base nos caminhos utilizados pelo código.

## Mapa das quatro camadas

| Camada | Fonte | Aplicação |
|---|---|---|
| Composição de abertura | [Capa Tijuca](../../dist/artes/capas/README.md) | Uma imagem PNG inteira na abertura. |
| Marca | [Três arquivos de marca](../../dist/artes/marca/README.md) | Logotipo, favicon e janela original, cada um com uso próprio. |
| Seleção e apresentação | [Dez SVGs](../../dist/arte/icones/README.md) e [dez PNGs](../../dist/arte/README.md) | SVGs na galeria/pausa; PNGs no roteiro, seleção de dificuldade, introdução, resultado e resumo. |
| Partida e interface | [Módulos de jogo](../../dist/README.md), [interface.js](../../dist/interface.js), [style.css](../../dist/style.css) | Canvas, caminhos SVG inline, moldura, cores, fonte e estados dos controles. |

## Arte desenhada no Canvas

O Canvas de partida tem **96 × 96 pixels lógicos**. Cada fábrica fornece `draw(ctx)`; helpers como retângulos, linhas e matrizes de caracteres constroem a cena. Trocar o PNG do menu não altera esse desenho.

| Módulo | Cenas e elementos construídos em código |
|---|---|
| [quintal.js](../../dist/quintal.js) | Goteira: balde, gotas e piso; Maré: caranguejo, concha, areia, baixios e pedras; Último Fio: bem-te-vi, mariposas e fios; Pipa: pipa, rabiola, pássaros, postes, casario e morros. |
| [esquina.js](../../dist/esquina.js) | Rádio: corpo, dial e sinais; Pão: pão, ovo, estados de preparo e utensílios; Rastro: caracol, folhas, vaso, chão e trilha. |
| [varanda.js](../../dist/varanda.js) | Luz: lagartixa, lâmpada e mosquitos; Gude: bolinha, pedras, buraco e mira; Pisca: vaga-lumes e sinais luminosos. |
| [pipa-aves.js](../../dist/pipa-aves.js) | Matriz do pássaro, paleta, formação em V e geometria de colisão compartilhada com a cena de Pipa. |
| [pracinha.js](../../dist/pracinha.js) | Código legado; não é importado pela aplicação ativa. Não confundir seus desenhos com novos jogos disponíveis. |

Mudar arte da partida requer preservar correspondência entre desenho e colisão, legibilidade do estado e controles. Os geradores de Maré, Rastro e Gude mudam a disposição dos elementos, não dependem de produzir PNGs para cada semente. Os guias [Quintal](../jogos/quintal/README.md), [Esquina](../jogos/esquina/README.md) e [Varanda](../jogos/varanda/README.md) explicam as regras.

## Ícones pequenos da interface

[interface.js](../../dist/interface.js) contém nove definições de caminhos em uma grade **16 × 16**: `som`, `mudo`, `janela`, `volta`, `pausa`, `casas`, `avulso`, `mapa` e `bandeira`. A função `icone(id)` gera SVG inline com `currentColor` e `aria-hidden`, sem carregar imagem externa. Isso não significa que todas as nove definições estejam sendo exibidas: as chamadas atuais em [app.js](../../dist/app.js) usam som/mudo, janela, volta, pausa, avulso e mapa; casas e bandeira são definições disponíveis sem chamada atual nesse módulo.

O símbolo inline `janela` indica a ação de abrir uma janela; ele não é o PNG de quatro vidraças da marca nem o favicon verde com M. Os direcionais dos controles são caracteres definidos pelo aplicativo, não arquivos adicionais de ícones.

## Fonte, paleta e escala

A fonte [miudezas.ttf](../../dist/arte/miudezas.ttf) é carregada por `@font-face` no CSS. A paleta da interface está em [style.css](../../dist/style.css); o campo `cor` em [catalogo.js](../../dist/catalogo.js) enquadra cada jogo; as cores internas aparecem nas funções de desenho. Essas três fontes não devem ser tratadas como uma única lista de cores de sprite. A ampliação pixelada conserva o aspecto de degraus, sem exigir transformar as artes em novas imagens maiores.

## Legado e manutenção

- [bairro.png](../../dist/arte/bairro.png): abertura antiga, sem uso na abertura atual.
- [janela.png](../../dist/arte/janela.png): original idêntico à cópia ativa de marca.
- [peteca.svg](../../dist/arte/peteca.svg) e [sombra.svg](../../dist/arte/sombra.svg): imagens históricas de jogos removidos.
- [gerar-miniaturas.mjs](../../scripts/gerar-miniaturas.mjs): ferramenta do código legado, não gerador dos dez ícones atuais.

Não foram movidos ativos, alterados caminhos de execução ou criadas imagens nesta organização. A auditoria conferiu dimensões PNG, viewBox SVG, referências no catálogo/HTML/CSS/aplicativo e igualdade da janela original. Links locais destes documentos foram verificados. Isso não certifica que uma miniatura histórica reproduza pixel a pixel a versão atual da cena; uma captura atual deve ser produzida e identificada separadamente, sem cursor.

[Índice de artes](../../dist/artes/README.md) · [Recursos](../../dist/arte/README.md) · [Manual principal](../../README.md)
