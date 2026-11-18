# Aplicação jogável

Esta é a raiz que o servidor entrega ao navegador. Para executar a partir desta pasta, rode `python3 -m http.server 8000 --bind 127.0.0.1` e abra http://localhost:8000. Os arquivos JavaScript são módulos ES nativos.

| Arquivo | Leia quando precisar de… |
|---|---|
| [index.html](index.html) | Entrada do aplicativo, metadados, favicon, regiões de tela e rodapé. |
| [style.css](style.css) | Paleta, fonte, janela, estados de foco, galeria e adaptação a telas estreitas ou baixas. |
| [app.js](app.js) | Navegação, avanço e retomada da volta, pausa, eventos de entrada e animação. |
| [catalogo.js](catalogo.js) | Ordem dos jogos, IDs, regras, controles, nomes de nível e cores de palco. |
| [progresso.js](progresso.js) | Migração da volta antiga por IDs, sem trocar resultados entre jogos. |
| [recordes.js](recordes.js) | Validação e atualização de recordes, separados dos resultados autorais. |
| [backup.js](backup.js) | Exportação/importação compatível de preferências, volta e recordes. |
| [interface.js](interface.js) | Ícones da barra, texto seguro para HTML e funções de armazenamento. |
| [quintal.js](quintal.js) | Chuva, maré, fios do bem-te-vi e pipa. |
| [esquina.js](esquina.js) | Sintonia, chapa e caminhos do caracol. |
| [varanda.js](varanda.js) | Bote, bolinha e sequências luminosas. |
| [pracinha.js](pracinha.js) | Código legado de Peteca/Gato, não importado pelo aplicativo. |
| [arte/](arte/README.md) | Imagens do menu e fonte local. |

Uma fábrica recebe o nível de 1 a 3, uma API com callbacks de som e conclusão e opções `{mode, seed}`. Os modos são `classic`, `endless` e `generated`; uma semente identifica a fase para reinício reproduzível. O método `score()` fornece a pontuação quando existe modo por recorde. Ela devolve controles, atualização, desenho e indicador. A interface central transforma eventos de teclado e toque no mesmo vocabulário. Para uma alteração de regra, revise a fábrica e o texto correspondente no catálogo. Para uma alteração de arte, confira a miniatura e o desenho da partida separadamente.

[Manual completo do projeto](../README.md)


## Capa da abertura

![Capa aprovada](artes/capas/miudezas-tijuca.png)

A [pasta artes](artes/README.md) guarda a composição oficial. A capa é exibida inteira, sem esticamento; regras e progresso não foram alterados.

## Marca da interface

[Logotipo e ícone verde](artes/marca/README.md) identificam os menus e o favicon, respectivamente. A pequena janela original permanece à esquerda do logotipo na barra. A partida mantém o título textual do jogo.

## Regras por módulo

O catálogo tem dez jogos. Sem Parar: Goteira, Último Fio, Pipa, Pão, Pisca e Luz de Varanda (três botes errados; sem prazo). Caminho Novo: Maré, Rastro e Três Petelecos. Rádio mantém somente fases autorais; Luz também conserva suas dificuldades originais. Os três geradores usam Puxado como referência e critérios próprios de solução e desafio. Consulte os guias de [Quintal](../docs/jogos/quintal/README.md), [Esquina](../docs/jogos/esquina/README.md) e [Varanda](../docs/jogos/varanda/README.md). A Volta no Bairro permanece nas três dificuldades.

## Entrada e pausa

Rastro aceita traçado iniciado no caracol, com avanço pelas casas vizinhas. Gude aceita arrasto iniciado sobre a bolinha; cancelar o ponteiro ou pausar não lança um peteleco. Controles de teclado e botões permanecem como alternativa acessível. `touch-action` é restrito ao tabuleiro, não à página inteira. A pausa oferece **Voltar às fases**, conservando a seleção atual, os saves e os recordes.

Consulte [dados](../docs/dados/README.md) e [testes](../tests/README.md). Simular ponteiros no navegador não demonstra compatibilidade com todos os aparelhos físicos.

A arte do caranguejo em `quintal.js` é desenhada na grade nativa, sem arquivos externos ou filtros. Consulte [a documentação do quintal](../docs/jogos/quintal/README.md#arte-do-caranguejo).

### Arte aprovada em `quintal.js`

Goteira, Último Fio e Pipa de Laje: detalhes discretos no cenário, sem alterar a jogabilidade. A arte aprovada de Maré já estava incorporada. A resolução lógica permanece 96 × 96, sem suavização ou nova dependência.

### Arte aprovada em `esquina.js`

Rádio de Pilha e Pão na Chapa: acabamento discreto em pixels, preservando todos os controles e objetivos. A resolução lógica permanece 96 × 96, sem suavização ou nova dependência.

### Arte aprovada em `varanda.js`

Luz de Varanda e Três Petelecos: luz, texturas e sprites refinados sem mudar obstáculos ou física. A resolução lógica permanece 96 × 96, sem suavização ou nova dependência.

Pisca preserva o primeiro desenho dos vaga-lumes preservado no GitHub (`9cc7bbb`) e da vegetação lateral em `varanda.js`. Rastro mantém três matrizes de folhas em `esquina.js`, atribuindo a variação uma única vez na criação da fase. Não há imagens remotas nem alteração de persistência.

### Refinamento seletivo dos tabuleiros

`quintal.js` e `esquina.js` acrescentam os detalhes aprovados de Maré e Rastro somente dentro de `draw()`. Grade, controles, geradores, colisões, soluções e saves continuam independentes da ornamentação.

### Imagens da seleção

O campo opcional `icone` do catálogo é usado pela galeria e pela pausa. Sem esse campo, mantém-se a miniatura existente. `foto(j, extra, selecao)` só escolhe o ícone quando `selecao` é verdadeiro; os outros fluxos preservam as cenas. Os dez assets aprovados estão em [arte/icones](arte/icones/README.md). Não há alteração de CSS, navegação ou persistência.

O sprite `vasoDestino` de Rastro usa 11 × 10 pixels e é centralizado dentro da casa P. A ampliação é exclusivamente visual; o identificador e as regras de vitória não mudam.


### Pão francês aprovado

Pão na Chapa usa a versão aprovada baseada na referência enviada: pão francês alongado, com dois cortes diagonais e cores chapadas. O sprite tem 13 × 16 pixels, desenhado em escala 2 na chapa. As quatro paletas mostram antes do ponto, no ponto, tostado e queimado, preservando a fumaça. Ovo, utensílios, áreas de toque, tempos, metas, reposições e alternância de lados não mudam. Os testes de identidade verificam o novo desenho em ambos os lados; a suíte mantém os testes dos três níveis, vitória, queima e três erros.


### Tela de pausa coesa

A pausa usa a mesma imagem da seleção: ícone aprovado quando disponível e miniatura original nos demais jogos. A imagem é contida sem recorte. “Continuar” e “Voltar às fases” permanecem na primeira linha; “Voltar ao menu” ocupa a segunda linha, centralizado e com a mesma largura dos demais botões. O ajuste é exclusivo da pausa e mantém navegação, progresso e controles. O teste de navegação verifica a arte e as três ações dos dez jogos.

### Goteira, Pipa e Pão na Chapa: últimos ícones aprovados

Os dois ícones usam a grade aprovada de 24 × 24 pixels, ampliada sem suavização: balde com alça simples e pipa inclinada. São compartilhados pela seleção e pela pausa; não alteram cenas jogáveis, colisões, controles ou saves. Pão na Chapa usa a versão intermediária aprovada de 32 × 32 pixels, com pão francês e ovo baseados nos sprites reais.
