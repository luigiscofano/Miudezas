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

`gerarRastro(seed)` usa uma grade **7 × 7**, como Puxado, e um gerador pseudoaleatório determinístico. Na família estreita, constrói candidatos com trilha simples de 27 a 34 casas, três folhas em pontos distintos e pedras fora do certificado. Exige pelo menos **seis bifurcações** (casas com três ou mais saídas), para que a solução não seja apenas seguir um corredor. Casas abertas adjacentes criam escolhas de percurso; entrar cedo no vaso continua bloqueado e cruzar o próprio rastro continua impossível.

Um certificado longo sozinho poderia esconder um atalho. Por isso, uma busca adicional testa todas as possibilidades de vitória com até **21 comandos**: acompanha posição, casas usadas, folhas restantes e entrada no vaso. O limite inferior de distância considera todas as ordens das folhas restantes e só elimina ramos que não podem caber nesse comprimento. Um candidato com solução curta é rejeitado. Se a busca atingir seu orçamento de 30.000 estados, ela é inconclusiva e o candidato também é rejeitado, nunca anunciado como validado. Como desfazer passos apaga o sufixo e devolve suas folhas, qualquer vitória pode ser representada pelo caminho simples que esse solver examina.

São no máximo **96 candidatos na família estreita e 288 na aberta**, cada caminhada com tamanho limitado. Se nenhum passar, o gerador utiliza uma configuração previamente verificada da própria família, refletida/rotacionada conforme a semente, mantendo as mesmas restrições e o certificado de solução. A família estreita conserva sua reserva original; a aberta tem duas configurações próprias e até oito orientações de cada uma. Esgotar o orçamento de uma fase aberta nunca a converte silenciosamente em estreita. A configuração de reserva também é coberta nos testes de ausência de atalho. Uma fase aceita tem solução executável e nenhuma vitória com menos de 22 comandos. Isso é um critério objetivo de complexidade, não uma garantia de dificuldade subjetiva idêntica entre jogadores.

A mesma semente reconstrói a mesma fase ao reiniciar. A interface principal troca a semente apenas quando o jogador solicita outra fase. As três fases autorais e os sprites continuam intactos.

### Família aberta, sem retirar a anterior

A família anterior, **estreita**, permanece no conjunto com seu algoritmo, configuração e fluxo pseudoaleatório originais: trilhas de 27–34 casas e pelo menos seis bifurcações. Pode ser reproduzida explicitamente com `gerarRastro(seed, 'estreito')`. Um teste fixa o certificado e o mapa das primeiras 100 sementes dessa família, evitando substituição silenciosa em alterações futuras.

A nova família **aberta** constrói certificados de 32–39 casas e exige simultaneamente:

- pelo menos **39 das 49 casas livres**;
- pelo menos **22 bifurcações**, com três ou mais saídas;
- pelo menos **12 blocos 2 × 2 inteiramente livres**, criando praças e áreas de decisão em vez de apenas corredores;
- três folhas e vaso alcançáveis sem cruzar o rastro, com certificado real validado;
- busca conclusiva rejeitando qualquer vitória de até 21 comandos, com o mesmo orçamento de 30.000 estados.

A seleção padrão mantém as famílias anteriores e acrescenta travessias: em cada bloco de doze sementes, quatro são estreitas, duas abertas, três irregulares e três são travessias. As quatro permanecem acessíveis; a semente reproduz a seleção e o mapa no reinício. Para diagnóstico e testes, `gerarRastro(seed, 'aberto')` e `options.family: 'aberto'` selecionam a família explicitamente. Os metadados `familia`, `areaLivre`, `bifurcacoes`, `pracas` e `fallback` permitem medir o resultado, sem prometer dificuldade subjetiva absoluta. Mais espaço oferece alternativas de ordem e decisões de caminho, mas não torna automaticamente toda fase mais difícil para todo jogador.

### Famílias irregular e travessia: ordem e percursos exigentes

A família **irregular** é uma adição, não uma substituição das anteriores. `gerarRastro(seed, 'irregular')` ou `options.family: 'irregular'` seleciona essa família explicitamente. O tabuleiro continua 7 × 7 e todas as regras, desenhos, gestos, fases autorais e saves permanecem iguais.

O gerador parte de oito topologias certificadas diferentes e aplica até **16 tentativas de mutação**: altera de uma a cinco casas fora da trilha-testemunha e desloca as três folhas ao longo dela. Rotações e reflexões diversificam a orientação, mas não são a única fonte de variedade. Cada resultado precisa atender simultaneamente:

- entre **30 e 38 casas livres**, pelo menos **dez bifurcações** e **três grupos separados de pedras**;
- solução executável, sem cruzar o próprio rastro, que recolhe as três folhas antes do vaso;
- nenhuma vitória em até **25 movimentos**: mínimo demonstrado de 26, superior ao limite de 22 das famílias anteriores;
- somente **uma a três das seis ordens possíveis de coleta** permitem vencer.

`analisarOrdensRastro` examina cada permutação de folhas separadamente. O estado da busca inclui a posição, todas as casas já ocupadas pelo rastro e a próxima folha da ordem. Portanto, não basta que as folhas estejam conectadas: reservar uma passagem e escolher a ordem realmente importa. Desfazer continua permitido pelas regras reais, devolvendo folhas do trecho desfeito. Qualquer vitória final corresponde a um caminho simples, exatamente o tipo de percurso analisado.

A busca de atalhos tem limite de **12.000 estados**; a análise de ordem usa **6.000 por permutação**. Se qualquer busca esgotar o orçamento, o candidato é rejeitado como inconclusivo, nunca aceito como uma prova de impossibilidade. Depois das 16 tentativas, usa-se o próprio modelo irregular orientado, novamente validado pelos mesmos critérios. Não há conversão silenciosa para família estreita ou aberta. O trabalho ocorre apenas na criação da fase, nunca por quadro.

Na amostra das sementes 0–299, a família irregular produziu **280 layouts distintos após normalizar as oito simetrias**, incluindo **227 topologias diferentes de pedras**, 270 conjuntos de posições de folhas e 21 posições iniciais. Das 300 fases, 170 aceitaram somente uma ordem de coleta, 122 aceitaram duas e oito aceitaram três. Houve 21 reservas próprias (7%). Esses indicadores demonstram variedade estrutural e restrições adicionais; não prometem dificuldade subjetiva idêntica ou superior em absolutamente todas as partidas.

As primeiras 100 sementes explícitas de cada família antiga são comparadas integralmente com hashes da versão anterior, incluindo mapas, certificados e metadados. Os geradores estreito, aberto e irregular não foram alterados para acomodar as travessias.

O conjunto **travessia**, selecionável por `gerarRastro(seed, 'travessia')` ou `options.family`, acrescenta cinco modelos próprios: **ferradura, varanda, enseada, cotovelo e contrafluxo**. Cada um tem uma topologia e um trajeto-testemunha diferentes, além de rotações e reflexões. As três folhas mudam de posição em faixas disjuntas do trajeto; até três pedras fora dele podem mudar em cada uma das 16 tentativas. O campo `padrao` identifica o modelo de origem, sem alterar a apresentação ou as regras.

Todas as travessias exigem **39 casas livres, 22 bifurcações e 12 praças 2 × 2**, no mínimo. São caminhos abertos com certificado executável e **nenhuma vitória em até 27 movimentos**: o mínimo demonstrado de 28 supera o das famílias anteriores. A busca usa as regras reais de ocupação e coleta, com orçamento de 30.000 estados; resultado inconclusivo rejeita o candidato. A reserva é sempre o próprio modelo orientado e passa novamente pelas mesmas verificações. Não se exige uma ordem única de folhas nessas áreas abertas: o critério é a ausência demonstrada de atalhos, mesmo considerando todas as ordens.

Nas sementes 0–499, após normalizar as oito simetrias, ferradura/varanda/enseada/cotovelo/contrafluxo produziram respectivamente **98/73/95/52/65 layouts** e **62/44/40/24/37 topologias de pedras**. Foram 95 reservas próprias em 500 fases (19%). O teste exige por padrão pelo menos 50 layouts, 20 topologias e 20 topologias ausentes na amostra de 100 sementes de cada família anterior. Isso prova variedade na amostra, não exclusividade sobre todo o espaço de sementes. O reinício conserva integralmente mapa e estado inicial; solicitar outra fase sorteia uma nova semente. A nova seleção muda o mapa gerado pela seleção padrão antiga, mas as famílias anteriores continuam reproduzíveis explicitamente e o formato de saves e backups permanece intacto.

A busca de atalhos memoriza o limite inferior para cada posição e subconjunto de folhas (oito combinações) e representa casas ocupadas em um vetor de bytes. Isso elimina permutações e alocações repetidas sem alterar caminhos examinados, orçamento ou critérios de aceitação. Uma comparação de 900 buscas com a versão anterior, em 100 travessias, três limites de comprimento e três orçamentos, confirmou inclusive a mesma contagem de estados.

Medição local das sementes 0–499 da família travessia, sem aquecimento separado e com os lotes finais executados sequencialmente: no Node v24.22.1, **p95 4,50 ms e máximo 10,95 ms**; no Chromium headless, **p95 4,30 ms e máximo 8,90 ms**; com CPU desacelerada em **4× via CDP**, **p95 18,60 ms e máximo 32,00 ms**. Todos os lotes conservaram as mesmas 95 reservas e a diversidade documentada. Esses números medem somente geração, não renderização nem latência de entrada. A desaceleração sintética aproxima menor capacidade de CPU, mas não substitui teste em celular físico; os máximos são da amostra, não limites universais.

### Traçar o rastro com mouse ou toque

Pressione sobre a célula atual do caracol e arraste pelo tabuleiro. O método `point(x, y, phase)` recebe coordenadas lógicas 96 × 96 e fases `down`, `move`, `up` ou `cancel`. Um percurso iniciado fora do caracol é ignorado. Soltar conserva o caminho; um novo gesto pode começar da posição atual.

A travessia de grade **DDA** processa, na ordem geométrica, cada fronteira de célula entre dois eventos. Um movimento rápido que cruza três casas não pula as duas intermediárias. Cada passagem chama a mesma função de movimento do teclado: pedras, rastro ocupado, vaso sem folhas e desfazer o último passo obedecem às mesmas regras. Ao encontrar um bloqueio, o gesto termina na última casa válida; para continuar é preciso pressionar novamente o caracol, evitando saltos através de obstáculos. Em um cruzamento exato de canto, a fronteira horizontal é processada antes da vertical, sem movimento diagonal instantâneo. Cancelamento ou pausa encerra somente a entrada, não apaga a trilha. Teclado e repetição por tecla continuam disponíveis.

## Contrato e verificações

As fábricas recebem `(nivel, api, options)`. `options.mode` é `classic`, `endless` ou `generated`; `options.seed` identifica a fase gerada. O módulo não escreve armazenamento por conta própria. Histórico, recordes e backup são responsabilidade da aplicação, evitando chaves paralelas ou alteração de saves aqui.

Execute:

```sh
node --test tests/pao.test.mjs tests/esquina-modos.test.mjs tests/rastro-padroes.test.mjs
```

A suíte verifica identidades, utensílios, toque, trocas, queimas únicas, três erros, metas separadas e vitória imediata nos três níveis; simula 20 minutos de Sem Parar; percorre **1.000 sementes** por controles reais, valida repetibilidade e variedade; desenha os mapas autorais; resolve os três autorais e 100 gerados com gestos de eventos espaçados; verifica bloqueio, início no caracol, cancelamento, preservação ao soltar e devolução de folha ao desfazer; e rejeita atalhos em 150 sementes, incluindo a reserva. A família aberta é testada separadamente em 200 sementes, incluindo execução por gesto, áreas livres, bifurcações, ausência de atalhos e reserva da mesma família. O teste adicional de padrões valida 300 fases irregulares, incluindo execução por gestos rápidos, ausência de atalhos, seis ordens de coleta, diversidade normalizada e fallback. O lote de travessias cobre 500 sementes, cinco padrões, reinício, execução por gesto, diversidade sem simetrias, reservas e rejeição de vitórias em até 27 passos. Testes automatizados não substituem a inspeção visual final no navegador e em dispositivos reais.

## Acabamento visual

Rádio de Pilha ganhou relevo de um pixel, grade e apoio; Pão na Chapa ganhou acabamento metálico e detalhe no miolo do pão. Utensílios, estados, fumaça, metas e três erros permanecem iguais. Nessa revisão, o desenho de Rastro de Prata permaneceu inalterado.

Os detalhes usam a grade nativa de 96 × 96, cores chapadas e bordas sem suavização. São apenas desenho: não representam novos obstáculos nem mudam colisões, controles, fases ou saves. As propostas foram comparadas com renderizações do próprio `draw()` antes da aplicação.

## Folhas de Rastro

As três folhas finas têm silhuetas levemente diferentes e a mesma paleta. A ordem das folhas no mapa define sua variante, calculada uma vez ao iniciar a fase; reiniciar mantém a aparência. A diferença é decorativa: todas são recolhidas pelas mesmas regras e mantêm o mesmo valor.

### Rastro: segundo refinamento visual

Cada ladrilho recebe uma linha clara de um pixel junto à borda superior, mantendo o centro livre para folhas e rastro. As folhas finas B, os sprites, mapas, gerador e regras permanecem iguais.

### Vaso de destino ampliado

Para facilitar a leitura no celular, o vaso agora ocupa 11 × 10 pixels em vez de 8 × 7. A abertura escura e a cerâmica mantêm as mesmas cores. O desenho cabe com margem dentro da menor casa (13 pixels), sem encostar na divisória nem cobrir células vizinhas. A vitória continua exigindo recolher as folhas e entrar na casa P.


### Pão francês

Pão na Chapa usa um sprite de pão francês alongado, com dois cortes diagonais e cores chapadas. O sprite tem 13 × 16 pixels, desenhado em escala 2 na chapa. As quatro paletas mostram antes do ponto, no ponto, tostado e queimado, preservando a fumaça. Ovo, utensílios, áreas de toque, tempos, metas, reposições e alternância de lados não mudam. Os testes de identidade verificam o novo desenho em ambos os lados; a suíte mantém os testes dos três níveis, vitória, queima e três erros.
