# Modos do quintal

O módulo `dist/quintal.js` desenha as cenas na grade original de 96 × 96 pixels. As fases autorais continuam disponíveis. Não há migração destrutiva de dados neste módulo: o aplicativo persiste os recordes e fornece `mode` e `seed` às fábricas.

| Jogo | Modo adicional | Razão e pontuação |
|---|---|---|
| Goteira | Sem Parar | Gotas contínuas, derrota natural por alagamento; gotas recolhidas, não as transbordadas. |
| Pipa | Sem Parar | Obstáculos contínuos; quantidade ultrapassada até uma colisão. |
| Fio de Varal | Sem Parar | Mariposas sucessivas e rajadas; quantidade recolhida antes de ser levado. |
| Maré Miúda | Caminho Novo | Percurso com objetivo definido e estado de maré; outra semente gera outra fase. |

## Goteira

Os nomes das fases são **Chuvisco**, **Chuva firme** e **Temporal**, na ordem Sossegado, Animado e Puxado.

O balde guarda no máximo quatro gotas. A quinta transborda e é imediatamente retirada da lista de gotas ativas. Gotas que chegam diretamente ao chão também contam uma vez. O piso molhado cresce até os limites: **12 no Sossegado, 9 no Animado, 6 no Puxado e 8 no Sem Parar**. O resultado “O chão alagou!” encerra a simulação uma única vez. O descarte lateral original continua esvaziando o balde. Os modos autorais conservam seu objetivo original por tempo; Sem Parar não termina aos 60 segundos. A cadência contínua tem intervalo mínimo de 1,35 s e velocidade máxima de 36 pixels/s.

## Pipa

Casario estreito com janelas altas, telhas em pixels e morros ao fundo distingue o cenário carioca. Postes e pássaros escuros são obstáculos; casas e morros são decorativos. Não existe mais a tampa superior de fios. Os postes mantêm os envelopes conservadores anteriores do corpo e da rabiola; nas aves em V, a colisão usa os pixels sólidos do corpo e do sprite. Postes mantêm seus isoladores e os bandos ocupam o alto da passagem.

Nas três fases autorais, passagens altas e baixas alternam seus centros entre as alturas 22 e 46. Pequenos bandos acima e postes abaixo delimitam aberturas sem uma altitude fixa segura. Sossegado, Animado e Puxado usam velocidades de 14, 17 e 20 pixels/s, respectivamente, e margens verticais de 8, 7 e 6 pixels em torno do centro; o número de obstáculos continua 4, 5 e 6. Há 70 pixels entre obstáculos para permitir reposicionamento. Os testes verificam derrota sem comandos e trajetórias vencedoras que sobem e descem, a 30/60/120 Hz.

O modo **Sem Parar não foi recalibrado nesta revisão**: mantém seu corredor próximo da altura 22, progressão e velocidade limitada a 23 pixels/s. Sua simulação de quatro minutos continua passando nos testes. Obstáculos que saíram da tela são descartados; o total ativo permanece limitado. Subpassos de no máximo 25 ms evitam atravessar obstáculos por um quadro lento.

## Fio de Varal

No catálogo, Último Fio usa **Brisa**, **Ventania** e **Vendavau**, na ordem Sossegado, Animado e Puxado. Os nomes são rótulos: os IDs, os índices de dificuldade e os dados salvos permanecem iguais.

As cinco posições de mariposas se repetem, sem vitória automática na quinta. Uma rajada na fileira ocupada termina a partida. A janela de aviso nunca cai abaixo de 0,9 s e o intervalo entre rajadas não fica menor que 2,8 s. A frequência sonora também é limitada para não crescer indefinidamente com o placar.

## Maré Miúda: prova executável de solução

A família original, preservada nas sementes não destinadas às famílias adicionais, usa um PRNG determinístico e tenta no máximo 48 candidatos. A família adicional é descrita abaixo. Para cada candidato, uma busca em largura considera **posição, número de passos módulo seis e última posição segura em areia**. Ela reproduz as regras reais: bloquear baixios na maré alta, alterar a maré a cada três passos, retornar à última areia se a subida ocorrer sobre um baixio e reconhecer a concha antes da mudança de maré.

A referência histórica da geração é o mapa anterior de **Puxado**, mantido separado das fases fixas: solução mínima de 17 comandos, contra 14 sem maré, e dois baixios individualmente indispensáveis. Cada mapa deve exigir **17 a 27 comandos**, custo adicional da maré de **pelo menos três comandos** e **dois baixios obrigatórios** (bloquear qualquer um impede chegar à concha). Além disso, remover as pedras precisa reduzir o caminho mínimo: pedras meramente decorativas não satisfazem esse critério. Essas verificações rejeitam atalhos secos e mapas solucionáveis sem lidar com o ciclo da maré.

A família original faz mutações locais do mapa autoral, incluindo acessos e obstáculos, e oito orientações possíveis. Não é um gerador irrestrito: conserva deliberadamente a escala e a estrutura de desafio do Puxado. Na validação anterior à ampliação, em 300 sementes dessa família houve 299 mapas e 49 sequências de solução distintos, com 17 a 23 comandos. Comparabilidade aqui é medida por essas métricas de regras, não uma promessa de dificuldade subjetiva idêntica. Após o limite de tentativas, um corredor fixo validado sob os mesmos critérios (também orientado pela semente) fornece uma saída segura. O retorno contém a semente, a solução e a indicação de fallback. Reiniciar com a mesma semente reproduz a mesma fase; gerar outra é responsabilidade do aplicativo. A solução não depende de física nem de tempo de reação: o jogo avança por comandos discretos.

## Verificações

`node --test tests/quintal-modos.test.mjs`

- 300 sementes reproduzíveis, com cada solução executada na instância real de Maré.
- Quarta gota armazenada, quinta transbordada, capacidade respeitada, derrota única e ausência de contagem após o fim.
- Limites de chão progressivos.
- Pipa: derrota sem comandos em cada dificuldade; subida e descida executáveis a 30/60/120 Hz; progressão de margens e velocidade; regressão de quatro minutos do modo contínuo; colisão encerra uma vez.
- Quinze mariposas sem vitória automática; derrota por rajada.

Esses são testes de lógica e simulação. Não substituem a inspeção visual de navegador e os testes manuais de toque do aplicativo completo.

### Arte do caranguejo

A matriz tem 11 × 8 pixels e fica dentro de cada casa de 12 × 12. Pinças, olhos e carapaça permanecem legíveis sem suavização. O espelhamento e o clarão de retorno à areia são preservados. Movimento, maré, mapas e persistência não dependem dessa matriz.

## Acabamento visual

Goteira recebeu moldura da janela, piso e reflexos no balde; Último Fio ganhou nuvens e telhados; Pipa de Laje recebeu uma segunda camada de morros e detalhes de fachadas e lajes. A dificuldade recém-recalibrada da Pipa permanece intacta. A arte do caranguejo já estava publicada e não foi duplicada.

Os detalhes usam a grade nativa de 96 × 96, cores chapadas e bordas sem suavização. São apenas desenho: não representam novos obstáculos nem mudam colisões, controles, fases ou saves. As propostas foram comparadas com renderizações do próprio `draw()` antes da aplicação.

### Maré: segundo refinamento visual

A costa recebe espuma em um pixel apenas no encontro com areia. Pequenos pontos sugerem areia, riscos diferenciam baixios, pedras ganham faces e a concha recebe preenchimento claro. O caranguejo é preservado. Nenhum detalhe cria passagem ou obstáculo: a matriz de terreno continua sendo a única fonte de colisões e movimentos.

## Novos padrões: enseadas irregulares

A família original continua disponível; os critérios de distribuição completos, incluindo as ampliações posteriores, estão descritos nas seções abaixo. Sementes divisíveis por três recebem a família `enseada-irregular`. Fases autorais, desenho, controles e armazenamento não mudam. As sementes da nova família representam mapas novos; o algoritmo não promete reproduzir mapas de versões antigas para esse subconjunto.

Em vez de apenas mudar pedras no corredor diagonal, a nova família constrói um caminho autoevitante, com início e concha em posições variáveis, curvas e retornos. O corredor não pode tocar lateralmente em si mesmo, evitando atalhos acidentais. Depois insere travessias rasas e pedras; somente a validação completa decide se o candidato pode ser entregue.

Cada enseada nova exige **23 a 27 comandos na solução mínima**, **pelo menos cinco comandos adicionais devido à maré** e **três baixios individualmente obrigatórios**. Retirar as pedras deve encurtar a solução. São limites mais exigentes que os mínimos anteriores (17 comandos, custo de maré 3 e dois baixios), sem aumentar a velocidade nem exigir reflexos: a maré continua avançando somente por movimentos válidos. Mais planejamento é medido por esses critérios, não por uma promessa de dificuldade subjetiva universal.

A busca certificadora inclui posição, fase do ciclo e última areia segura, tal como a partida. A geração tenta no máximo **96 candidatos** e, se necessário, escolhe entre quatro reservas irregulares, orientadas pela semente e verificadas pelos mesmos critérios. O fallback não é uma fase fácil sem maré.

`node --test tests/mare-padroes.test.mjs` verifica hashes de seis sementes antigas, reprodução e reinício, execução das soluções em 100 novas sementes e uso de reservas. No lote 0, 3, …, 297 houve **95 topologias distintas**, mesmo removendo pedras decorativas e normalizando rotações/reflexões, com 55 posições iniciais e 38 posições de concha; oito sementes usaram reserva. A diversidade é de percurso, não só de orientação ou cor.

Esses testes exercitam lógica discreta. Não constituem avaliação humana de dificuldade nem benchmark de todos os celulares; os limites de tentativas evitam buscas ilimitadas, mas o custo de geração ainda varia com o dispositivo.

## Puxado escolhido pela imagem

O mapa da captura identificada pela semente `1428316038` foi fixado como Puxado. Areia, água, pedras, baixios e concha conservam suas posições; apenas o início passa para a última linha, coluna 4 (coordenadas zero-based x=3, y=7). O siri da captura estava durante uma tentativa, não era uma indicação de onde iniciar.

A solução mínima tem 21 comandos, contra 15 sem maré, e quatro baixios indispensáveis. A concha continua na coluna 1, linha 2. O teste compara a grade à semente original com somente a posição inicial substituída, executa a solução no jogo e confere vitória única. Sossegado, Animado, saves e regras não mudam. A referência histórica de geração foi isolada para não transformar outros mapas por efeito colateral.

## Arquipélagos: escolhas entre ilhas e travessias

Uma terceira família amplia os padrões sem substituir as duas anteriores. Sementes divisíveis por três continuam usando enseadas irregulares; entre as demais, múltiplos de sete recebem `arquipelago`. As restantes alternam o gerador original e as faixas avançadas descritas abaixo. A semente de referência **1428316038** permanece na família irregular, com seu mapa inalterado.

O arquipélago distribui nove pequenas ilhas de areia, interligadas por uma árvore de travessias rasas. As salas permitem circular e preparar o ciclo da maré, em vez de oferecer somente um corredor autoevitante. Pedras dentro das ilhas alteram desvios; pedras entre ilhas bloqueiam atalhos. A árvore e a posição das pontes variam por semente. A direção até a concha não implica que a travessia seguinte esteja disponível naquele momento.

São exigidos **23–27 comandos mínimos**, **sete comandos adicionais de planejamento da maré**, **três baixios indispensáveis** e redução do caminho caso as pedras fossem retiradas. A certificação continua incluindo posição, ciclo da maré e última areia segura; não basta conexão geométrica. Há no máximo 48 tentativas, seguidas de uma reserva testada pelos mesmos critérios. Nenhum timer ou reflexo extra é introduzido.

`tests/mare-variacoes.test.mjs` executa soluções de 100 sementes no jogo real, verifica reprodução, diversidade normalizada sem contar rotação/reflexão ou pedras decorativas, e pelo menos oito casas com três ou mais saídas em cada mapa. As duas famílias anteriores permanecem acessíveis. No benchmark local em Node, 100 gerações levaram aproximadamente 918 ms no total (mediana 7,3 ms; percentil 95 de 31,2 ms; máximo 60,6 ms), com uma reserva acionada. Esses tempos são observações da máquina de testes, não garantia de desempenho em celulares.

## Mistura avançada: muito difícil e muitíssimo difícil

Duas famílias adicionais se misturam em **Caminho Novo**, sem novos botões e sem substituir o Puxado fixo. A prioridade das famílias existentes é preservada: divisíveis por três continuam nas enseadas, e os demais divisíveis por sete nos arquipélagos. Somente no ramo restante, múltiplos de 13 recebem `muitissimo-dificil` e múltiplos de 11 recebem `muito-dificil`. Antes da ampliação de canais descrita a seguir, as outras sementes conservavam exatamente o resultado anterior (aproximadamente 91% das sementes); a referência **1428316038** não muda.

| Critério certificado | Muito difícil | Muitíssimo difícil |
|---|---|---|
| Solução mínima | 30–48 comandos | 38–60 comandos |
| Custo adicional causado pela maré | 12–17 comandos | Pelo menos 18 comandos |
| Travessias individualmente indispensáveis | Pelo menos 5 | Pelo menos 6 |
| Escolhas locais alcançáveis | Pelo menos 8 casas com três ou mais saídas | Mesmo mínimo |
| Praças secas para circular e ajustar a maré | Pelo menos 2 blocos de areia 2×2 | Mesmo mínimo |
| Relevância das pedras | Retirá-las encurta a solução mínima | Mesma condição |

As famílias reutilizam a construção de ilhas e pontes, mas selecionam relações mais exigentes entre rotas, travessias obrigatórias e ciclo da água. O jogador precisa preparar a maré em várias passagens; uma direção geometricamente promissora pode estar fechada naquele momento. As praças oferecem rotas alternativas para ajustar o ciclo. O critério não é apenas alongar o corredor: remover a maré deve economizar a quantidade mínima indicada, e bloquear cada portal obrigatório impede a chegada.

**Limite da interpretação:** quantidade de saídas e praças são indicadores de escolhas disponíveis, não uma contagem de decisões difíceis ou becos enganosos. O custo da maré é a diferença entre duas soluções mínimas sob regras distintas. São critérios verificáveis de planejamento, não avaliação humana universal de dificuldade. As duas faixas não se sobrepõem no custo da maré, mesmo quando seus comprimentos coincidem.

A busca mantém o estado completo (posição, fase do ciclo, última areia segura). Cada geração tenta no máximo 64 candidatos, com filtro de comprimento antes da análise detalhada. Há duas reservas muito difíceis e oito muitíssimo difíceis; todas são revalidadas com os mesmos limites ao serem escolhidas. Uma reserva não dispensa a prova e não vira um mapa fácil. A geração não acontece a cada quadro, não altera timers e não exige reflexos adicionais.

Cinco padrões adicionais de **canais irregulares** entram somente depois das prioridades 3, 7, 13 e 11. No ramo restante, o primeiro divisor aplicável entre 17, 19, 23, 29 e 31 escolhe o padrão. A família original continua no restante. Não há nova opção na interface; repetir conserva a semente. Saves, fases autorais, desenhos e regras permanecem intactos.

| Padrão | Estrutura certificada | Planejamento exigido |
|---|---|---|
| `canais-ramificados` (17) | Árvore com pelo menos uma bifurcação | Distinguir ramais e becos, sincronizando os gargalos obrigatórios. |
| `anel-de-mare` (19) | Exatamente um ciclo independente; pelo menos um baixio não obrigatório | Escolher acesso e momento no anel, sem dispensar as travessias obrigatórias. |
| `bacias-gemeas` (23) | Exatamente dois ciclos independentes; pelo menos dois baixios não obrigatórios | Coordenar os dois circuitos e os gargalos que ligam a rota à concha. |
| `estreito-duplo` (29) | Árvore e exatamente um par de baixios adjacentes, ambos obrigatórios | Entrar no estreito na janela correta; subir a água no segundo baixio devolve à última areia. |
| `anel-e-estreito` (31) | Um ciclo, passagem alternativa e estreito duplo obrigatório | Combinar a escolha no anel com a janela mais estreita de travessia. |

Esses padrões não reutilizam os tabuleiros anteriores: constroem uma árvore sobre dezesseis encontros, variam os espaçamentos **2/2/3** de cada eixo e acrescentam zero, uma ou duas conexões independentes. Sorteiam início, concha, baixios e pedras. A conexão da árvore, a posição dos anéis e as larguras dos canais mudam por semente. Rotações e reflexões só orientam as reservas; não contam como diversidade nos testes.

Todos exigem **30–60 comandos mínimos**, **custo de maré ≥8**, **três baixios individualmente indispensáveis** e solução menor ao retirar as pedras. Nas famílias duplas, bloquear qualquer uma das duas casas do estreito deve impedir a chegada: um par decorativo é rejeitado. A assinatura espacial e a conectividade são verificadas antes da busca completa. Há no máximo **128 candidatos**, seguidos de uma das **oito reservas próprias por padrão**, também certificada em tempo de geração. As reservas conservam a dificuldade; a geração ocorre uma vez ao criar a fase. Anéis e bifurcações descrevem opções topológicas, não garantem que toda decisão seja subjetivamente difícil.

### Verificações e desempenho

`node --test tests/mare-extrema.test.mjs tests/quintal-modos.test.mjs`

Foram executadas 100 sementes de cada faixa no jogo real, além do lote misto de 300 sementes. O teste verifica reprodução, solução, pontes obrigatórias, custo da maré, escolhas, praças e diversidade após remover pedras decorativas e normalizar rotações/reflexões. O lote muito difícil teve 72 topologias normalizadas, 33–40 comandos e custo 12–17; o muitíssimo difícil teve 68 topologias, 39–40 comandos e custo 18–22. Trinta e quarenta sementes, respectivamente, usaram reservas: a taxa é explicitada porque a geração tem orçamento limitado.

Benchmark local em Node, 100 gerações por faixa: muito difícil com mediana 8,3 ms, percentil 95 de 21,5 ms e máximo 29,0 ms; muitíssimo difícil com mediana 8,8 ms, percentil 95 de 15,5 ms e máximo 41,1 ms. São medições desta máquina, não garantias para celulares. O roteiro de revisão visual e toque continua necessário; não foi alterado por esses testes discretos.

## Pipa: bando em V

A coluna de aves foi substituída por uma formação com ponta inferior e pares ascendentes, abrindo um V. A altura determina de duas a cinco fileiras (uma ave na ponta e até quatro pares): 3, 5, 7 ou 9 aves; a documentação visual mostra exemplos com 3, 7 e 9 aves. Cada ave mantém o sprite rudimentar de 7 × 4 pixels. Postes, casario, pipa, vento, velocidades 14/17/20, margens 8/7/6, controles e saves não mudam.

`dist/pipa-aves.js` reúne formação, paleta, sprite e colisão. O corpo da pipa é comparado aos pixels sólidos das aves, nas mesmas coordenadas inteiras do desenho. Não existe uma caixa sólida cobrindo o interior vazio do V. A rabiola mantém a regra anterior contra postes; a linha decorativa não causa colisão com aves. Os subpassos de até 25 ms continuam evitando saltos na física. Os bandos e seus limites laterais são calculados ao criar o obstáculo, não a cada quadro.

O ponto só é somado quando todo o bando, inclusive a ave mais à direita, passou pelo corpo da pipa. O descarte e a renderização consideram as duas asas da formação, evitando cortes prematuros nas laterais do visor. Sem Parar conserva a alternância anterior entre postes com e sem obstáculo aéreo, agora usando pequenos Vs onde havia uma ave. A partida segue após superar o recorde, sem alterar a persistência.

Os testes verificam simetria, quantidades, pixels sólidos e interior vazio; executam trajetórias pelos controles reais nas três dificuldades a 30/60/120 Hz, confirmam derrota sem movimento e testam dez minutos de Sem Parar em cada dificuldade com memória limitada. São simulações da lógica real em Node, não ensaios em celular físico.

No lote adicional de **100 sementes por padrão**, todas as 500 soluções foram executadas pelos controles reais, conferindo posição, passos, maré, retorno à areia, comandos bloqueados e vitória única. A normalização abaixo elimina rotação/reflexão, pedras decorativas e posição de início/concha; a coluna de geometria elimina também a posição dos baixios.

| Padrão | Topologias / geometrias | Passos mínimos | Custo da maré | Reservas / 100 | Sementes reproduzíveis |
|---|---|---|---|---|---|
| `canais-ramificados` | 83 / 80 | 30–50 | 8–19 | 25 | 17, 34, 68 |
| `anel-de-mare` | 85 / 84 | 30–44 | 8–32 | 22 | 19, 38, 76 |
| `bacias-gemeas` | 57 / 57 | 30–42 | 8–30 | 51 | 23, 46, 92 |
| `estreito-duplo` | 69 / 65 | 31–51 | 8–31 | 39 | 29, 58, 116 |
| `anel-e-estreito` | 53 / 53 | 30–51 | 8–35 | 55 | 31, 62, 124 |

As taxas de reserva são explícitas: anéis combinados com gargalos temporais são mais seletivos. Cada padrão ainda precisa produzir pelo menos 35 geometrias distintas no lote, mesmo descontando todos os espelhamentos, rotações e posições dos baixios. As 40 reservas também têm testes individuais. O hash agregado de 269 sementes não selecionadas para os canais é idêntico ao commit anterior `37e7d3c`; as outras 31 do lote 0–299 passam à nova mistura. A semente de referência **1428316038** permanece intocada.

Para reproduzir soluções e métricas de qualquer exemplo:

```sh
node --input-type=module -e "import {gerarMare} from './dist/quintal.js'; for (const seed of [17,19,23,29,31,68,76,116]) { const m=gerarMare(seed); console.log(seed,m.family,m.fallback,m.metrics,m.solution.join(' ')); }"
node --test tests/mare-canais.test.mjs tests/mare-extrema.test.mjs tests/quintal-modos.test.mjs
```

A dificuldade é medida pelas soluções mínimas e dependências de maré/pedras, não pelo tamanho visual do caminho. Os testes automatizados não substituem avaliação humana de conforto e desafio em celular.
