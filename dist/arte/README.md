# Acervo visual de Miudezas

A capa estabelece o bairro; as miniaturas apresentam o recorte de cada parada. O código de jogo desenha os personagens em movimento no Canvas. Assim, trocar uma miniatura altera a seleção e os cartões de resultado, enquanto uma mudança no sprite jogável pertence à fábrica correspondente.

| Arquivo | Formato | Uso |
|---|---|---|
| [bairro.png](bairro.png) | PNG, 192 × 88 | Paisagem legada; não é mais usada na abertura. |
| [janela.png](janela.png) | PNG, 16 × 16 | Favicon e símbolo da barra de título. |
| [miudezas.ttf](miudezas.ttf) | TrueType | Títulos, níveis, controles e indicadores pixelados, com caracteres acentuados em português. |

## Miniaturas

Cada PNG da coleção original abaixo mede 128 × 120. O nome-base corresponde ao ID usado no catálogo.

| Quintal | Esquina | Varanda |
|---|---|---|
| [Goteira](goteira.png) | [Rádio de Pilha](radio.png) | [Luz de Varanda](luz.png) |
| [Maré Miúda](mare.png) | [Pão na Chapa](pao.png) | [Três Petelecos](gude.png) |
| [Último Fio](fio.png) | — | — |
| [Pipa de Laje](pipa.png) | [Rastro de Prata](rastro.png) | [Pisca no Mato](pisca.png) |

O fundo contínuo, o contorno em degraus e os poucos pontos de destaque permitem reconhecer a cena em miniatura. A fonte é registrada por @font-face no CSS. A ampliação do desenho usa renderização pixelada. O controle fino das cores fica em [style.css](../style.css), nos campos de palco de [catalogo.js](../catalogo.js) e nas funções de desenho.

[Identidade visual e fichas dos jogos](../../README.md#identidade-visual)

## Pracinha

[Peteca](peteca.svg) · [Gato na Sombra](sombra.svg)

Essas duas miniaturas são SVGs na mesma grade de 96 × 96 usada nas partidas, com retângulos inteiros e crispEdges. Execute `node scripts/gerar-miniaturas.mjs` na raiz para atualizar os arquivos a partir de pracinha.js. Assim, a seleção apresenta os próprios sprites jogáveis.


## Nova capa

![Capa aprovada](../artes/capas/miudezas-tijuca.png)

A abertura usa a [capa Tijuca](../artes/capas/README.md). Este diretório mantém os recursos das partidas e o cenário anterior como legado.

## Ícone atual

A janela original `janela.png` continua ativa na barra superior, com uma cópia documentada em [artes/marca](../artes/marca/README.md). O favicon atual é o [ícone verde aprovado](../artes/marca/miudezas-icone-verde.png), documentado na [marca](../artes/marca/README.md).

## Ícones da seleção

A pasta [icones](icones/README.md) contém os sete símbolos aprovados para Rádio de Pilha, Três Petelecos, Pisca no Mato, Luz de Varanda, Maré Miúda, Último Fio e Rastro de Prata. Os PNGs de cenas desta pasta continuam disponíveis para introduções e resultados. Os demais jogos ainda utilizam suas miniaturas originais na seleção.
