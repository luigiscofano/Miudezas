# Esquina: rádio, chapa e jardim

O módulo [`dist/esquina.js`](../../../dist/esquina.js) mantém os desenhos em pixels da tela lógica de 96 × 96. A alteração de modos não substitui os sprites, controles, paleta ou fases autorais.

## Modos por jogo

| Jogo | Dificuldades autorais | Novo modo | Decisão |
|---|---|---|---|
| Rádio | Sossegado, Animado e Puxado | Nenhum | As três notícias formam uma história finita, com bateria e desfecho. Repetir frequências sem história seria uma tarefa artificial, não uma continuidade natural. |
| Pão na Chapa | As três dificuldades | Sem Parar | Reposição de alimentos e três erros constituem um ciclo contínuo com derrota natural. |
| Rastro de Prata | As três dificuldades | Caminho Novo | O percurso tem objetivo e fim; novas fases preservam essa estrutura, em vez de prolongar a mesma fase artificialmente. |

## Pão na Chapa

Cada fase exige **ovos e pães separadamente**: 3 de cada no Sossegado, 4 no Animado e 5 no Puxado. O HUD exibe os dois contadores. A vitória é imediata no recolhimento que completa as duas metas; o estado final bloqueia relógio e entradas. O prazo de 60 segundos de jogo ativo e o terceiro erro encerram em derrota. A pausa visual de troca de lados não cozinha os alimentos nem consome esse tempo, preservando a regra anterior.

Há sempre um ovo e um pão, com identidades próprias e mudança de lados a cada duas reposições. A espátula recolhe ovo; a pinça recolhe pão. Queimar ou usar utensílio errado custa um erro. Uma queima é marcada antes da contagem e não pode ser cobrada novamente a cada quadro. Recolher cru apenas informa que se deve aguardar. Cores e fumaça continuam indicando o ponto, **sem quadradinhos de estado**.

No **Sem Parar**, não existem metas de vitória nem prazo final. Cada alimento corretamente servido vale um ponto, inclusive tostado antes de queimar. A velocidade de preparo cresce 0,3% por alimento até o teto de 125% da velocidade inicial. O aumento é limitado para conservar uma janela de reação legível. A pontuação é exposta por `score()` ao histórico central. O terceiro erro é a única condição de fim nesse modo.

## Rastro de Prata: solução demonstrável

`gerarRastro(seed)` usa um gerador pseudoaleatório determinístico e produz um tabuleiro 6 × 6. Constrói primeiro uma trilha simples de 17 a 24 casas, coloca três folhas em pontos distintos e só então distribui pedras fora dessa trilha. O vaso fica no fim. O jogador pode explorar alternativas abertas, mas sempre existe o percurso testemunha.

São no máximo 32 tentativas de caminhada limitada. Se nenhuma atingir o comprimento pretendido, utiliza-se um percurso serpenteado conhecido. Nenhuma busca ilimitada ocorre durante renderização. A validação anterior à apresentação confere limites, pedras, casas já ocupadas pelo próprio rastro, três folhas e chegada ao vaso somente ao fim. A solução não depende de atravessar a própria trilha nem de voltar através de folhas coletadas. Os testes executam todos os comandos da solução pela mesma interface `press`/`release` usada pelo jogo.

A mesma semente reconstrói a mesma fase ao reiniciar. A interface principal é responsável por trocar a semente apenas quando o jogador solicita outra fase. As três fases autorais e os sprites foram recuperados sem alteração do histórico do projeto: suas constantes tinham sido removidas por uma regressão anterior.

## Contrato e verificações

As fábricas recebem `(nivel, api, options)`. `options.mode` é `classic`, `endless` ou `generated`; `options.seed` identifica a fase gerada. O módulo não escreve armazenamento por conta própria. Histórico, recordes e backup são responsabilidade da aplicação, evitando chaves paralelas ou alteração de saves aqui.

Execute:

```sh
node --test tests/pao.test.mjs tests/esquina-modos.test.mjs
```

A suíte verifica identidades, utensílios, toque, trocas, queimas únicas, três erros, metas separadas e vitória imediata nos três níveis; simula 20 minutos de Sem Parar; percorre **1.000 sementes** por controles reais, valida repetibilidade e variedade; e desenha os mapas autorais com os sprites restaurados. Testes automatizados não substituem a inspeção visual final no navegador e em dispositivos reais.
