# Varanda: luz, bolinha e memória

Implementação: [`dist/varanda.js`](../../../dist/varanda.js). Os modos respeitam o desenho em pixels e os controles anteriores.

| Jogo | Modos | Justificativa |
| --- | --- | --- |
| Luz de Varanda | Dificuldades autorais e Sem Parar | O terceiro bote errado encerra todos os modos; capturas medem o recorde em Sem Parar. |
| Bolinha de Gude | Dificuldades autorais e Caminho Novo | Percurso completo, buraco e até três petelecos; outra fase pode ser gerada após a conclusão. |
| Pisca no Mato | Dificuldades autorais e Sem Parar | A memória cresce uma piscada por rodada e errar encerra naturalmente a partida. |

## Pisca no Mato: Sem Parar

Pontuação: tamanho da **maior sequência concluída**, não respostas de uma sequência incompleta. Não há meta final nem cronômetro de encerramento. Superar recorde não encerra a partida. A duração das piscadas continua legível, sem aceleração ilimitada. Clique/toque à esquerda/direita ou use as setas correspondentes. O gerenciador central registra `score()` no histórico separado do jogo e backup.

As dificuldades clássicas mantêm três, quatro e cinco piscadas. Foi declarado o desenho do vagalume: anteriormente o renderizador referenciava variável inexistente.

## Luz de Varanda: Sem Parar

Cada mosquito capturado vale um ponto. Um bote desalinhado consome uma das três tentativas; no terceiro erro termina em derrota, sem meta final nem prazo. A velocidade angular cresce 0,07 por captura, partindo de 1,98 e limitada a 3,8 rad/s. O tamanho da janela de acerto não diminui indefinidamente. Botes em andamento não aceitam outro ataque, evitando erros duplicados. O clássico preserva suas metas e seu prazo.

## Bolinha de Gude: Caminho Novo

`criarTerrenoGude(seed)` usa um gerador determinístico. A semente reconstrói alvo, pedras e certificado de solução com até três petelecos. As fases autorais são fixas e independentes da geração; suas novas disposições estão descritas abaixo. O gerenciador deve conservar a semente ao tentar novamente e fornecer outra somente ao pedir nova fase.

O certificado não é apenas conectividade: `validarTerrenoGude()` instancia **o mesmo jogo**, pressiona e solta controles públicos e executa a física real, incluindo alcance carregado, desaceleração, ricochetes, colisões e raio do buraco. Verifica 30, 60 e 120 atualizações/s e oito combinações de erro de ±15 ms ao soltar os três gestos. Também repete o certificado por arrasto com perturbação de ±0,25 pixel lógico em ambos os eixos, nas mesmas frequências, verificando que o gesto cabe no tabuleiro. Geração limitada a 64 tentativas, seguida de percurso seguro também validado. Se até ele falhar, lança erro em vez de apresentar mapa sem certificado.

Como referência mínima histórica do Puxado anterior, exige pelo menos duas pedras e área total de obstáculos de 360 pixels quadrados (duas pedras antigas de 15 × 12). Rejeita mapas em que mirar diretamente no buraco vence com qualquer alcance inteiro de 3 a 94, incluindo os ricochetes dessa tentativa. Isso exige trabalhar direção e força; não prova equivalência subjetiva de dificuldade. O gerador sorteia percursos de dois ou três tiros e depois distribui de três a sete pedras independentes, com pelo menos cinco pixels de separação. Não divide mais uma barreira fixa em pedaços para aparentar variedade. Há cotovelos (dois tiros), travessias e retornos (três tiros), com diferentes comprimentos e posições, inclusive inícios e destinos na região interna do tabuleiro. O percurso certificado mantém folga de seis pixels das pedras; a validação física final continua obrigatória. Cada candidato tenta até 120 posições de pedras, dentro do limite global de 64 candidatos. A saída de segurança permanece um percurso previamente conhecido e é validada novamente. O jogador pode descobrir outras soluções; não há autopiloto. A prova garante a existência de uma sequência executável, não a vitória com qualquer força ou caminho.

**Cinco padrões planejados adicionais.** As sementes pares (50%) reservam as novas plantas; as ímpares (50%) continuam no gerador anterior, incluindo cotovelos, travessias, retornos e passagens escalonadas. Não se promete preservar a maioria das sementes: metade recebe novos mapas. Dentro da reserva, `semente % 5` distribui igualmente as cinco famílias. Os percentuais históricos registrados abaixo descrevem versões anteriores a esta reserva.

| Padrão | Semente de exemplo | Decisão espacial |
| --- | --- | --- |
| Chicane | 0 | Travessia longa por baixo de um bloco largo, subida pelo corredor lateral e saída curta entre a barreira e a pedra superior. |
| Ferradura | 6 | Contornar um pilar comprido e voltar ao outro lado, com início e buraco próximos em altura. |
| Ilha | 2 | Sair por baixo da ilha, subir pela lateral e retornar até o buraco recuado; pedras periféricas fecham as diagonais e os retornos curtos encontrados na revisão. |
| Degraus | 8 | Descer ao lado de um pilar, cruzar abaixo de uma pedra horizontal desencontrada e terminar com um avanço curto entre o degrau inferior e a guarda lateral. |
| Bolso | 4 | Sair de um bolso comprido, protegido em cima, embaixo e à direita; só então subir e retornar para o buraco acima da cobertura. |

São cinco disposições próprias de início, buraco, pedras e percurso, não cinco nomes para rotações. Escalas independentes por eixo, deslocamentos e oito orientações variam cada planta. A família Bolso substitui o antigo ricochete: o tiro longo daquele certificado podia ser trocado por um avanço direto de dez pixels, portanto a ida e volta não sustentava uma alegação de dificuldade. O teste reproduz essa vitória antiga e exige que a saída curta falhe no novo bolso, por teclado e toque. No novo certificado, o primeiro alcance corresponde ao deslocamento efetivo de mais de 50 pixels, sem ida e volta decorativa.

Cada candidato passa pela física e controles reais. Além dos oito ensaios de teclado com ±15 ms, verifica **64 combinações independentes** de ±0,25 pixel lógico nos dois eixos dos três arrastos, em 30/60/120 Hz. As puxadas precisam caber no canvas. Mirar diretamente no buraco com os alcances inteiros 3 a 94 deve falhar, e pelo menos quatro das seis perturbações de força de ±30% devem perder. As pedras conservam cinco pixels de separação e permanecem dentro do tabuleiro.

A revisão também acrescenta uma busca dirigida de atalhos com **824 combinações** de primeiro tiro: 24 direções espaçadas em 15°, alcances inteiros 4–94 nas quatro cardinais e alcances 6–94 de quatro em quatro nas outras vinte. Depois da parada física real, inclusive colisões e ricochetes, o segundo arrasto mira o buraco com alcance igual à distância. Gestos que saem do canvas são descartados. Uma vitória em um ou dois tiros nessa amostragem rejeita o candidato. Essa busca a 60 Hz não esgota ângulos/forças contínuos, outras direções do segundo tiro ou outras frequências; não prova solução única nem ausência global de atalhos.

A busca tenta no máximo 12 variantes, sendo a última a planta original também certificada e examinada por atalhos. Se todas falharem, recorre ao gerador anterior com seus limites e fallback existentes. Nada muda na física, nos controles, nos desenhos, nas fases autorais ou no formato de progresso/backup.

`node --test tests/gude-padroes.test.mjs tests/varanda-modos.test.mjs` cobre 20 sementes por padrão, reprodução exata, certificados de teclado/toque, força, omissão de cada tiro, busca de atalhos, regressão da saída curta do antigo ricochete, cinco assinaturas de ocupação distintas após normalização por rotação/reflexão e rejeição forçada dos 12 candidatos com fallback executável. A suíte geral continua cobrindo 500 sementes e disponibilidade das famílias antigas. Na revisão anterior à otimização, os 191 testes da suíte completa passaram. As 500 sementes incluem 50 mapas de cada família nova e 250 antigos; 100 sementes ímpares entre 1 e 199 foram comparadas byte a byte com a base anterior ao PR. A verificação de atalhos acrescenta custo: em 20 sementes pares, geração p95 de aproximadamente 182 ms e máximo de 208 ms em Node, sem garantia equivalente em celular. A margem é medida em coordenadas lógicas; não equivale a teste de ergonomia num aparelho físico nem a prova de dificuldade subjetiva.

**Preparação fora da interface.** O gerador síncrono `criarTerrenoGude()` e as fábricas de jogo conservam seus contratos para ferramentas e testes. A interface solicita os mapas de Três Petelecos a um Worker de módulo, mostra “Preparando uma fase com solução…” e só cria a partida depois da resposta. O Worker executa o mesmo gerador completo, com todos os certificados, as 824 primeiras jogadas da busca de atalhos, os limites de tentativas e o fallback validado. Os outros jogos e as dificuldades autorais continuam no fluxo anterior.

Antes de isolar o cálculo, duas otimizações reduziram trabalho redundante: os oito casos únicos de teclado são simulados uma vez por frequência (24 simulações, em vez de 192); os 64 casos de toque continuam completos em cada frequência. A nova leitura `position()` devolve somente uma cópia de `{x,y}`, evitando clonar pedras e certificado nas simulações. `snapshot()` permanece isolado e com o mesmo conteúdo. Trinta mapas pares foram comparados byte a byte à revisão anterior, com hash de regressão nos testes. Na comparação Node com 30 sementes, o p95 passou de aproximadamente 221 para 109 ms; como ainda era relevante, o cálculo da interface foi transferido ao Worker.

Cada solicitação possui seu próprio Worker. Voltar às fases/menu, reiniciar, ocultar a aba, abrir configurações ou sair da página termina o cálculo em andamento; a identidade da solicitação impede que uma resposta antiga reabra a partida. Abrir configurações durante a preparação retorna às fases antes de abrir o modal, conservando a semente e impedindo uma partida oculta. Falha ao iniciar, erro de execução/comunicação ou prazo de 30 segundos encerra o Worker e oferece tentar a mesma semente novamente ou voltar às fases. Em navegadores sem Worker de módulo, mostra o mesmo erro recuperável: não executa o gerador síncrono na interface e não entrega um mapa sem validação. O fallback de terreno permanece dentro do Worker; erro de infraestrutura não é tratado como certificado válido.

A medição opcional em navegador é reproduzível com Playwright/Chromium instalado:

```sh
git show e2f7bc4:dist/varanda.js > /tmp/gude-antes.mjs
GUDE_ANTES=/tmp/gude-antes.mjs node tests/gude-desempenho.mjs
```

O script compara o código anterior, o gerador otimizado síncrono e o Worker, usando 30 sementes pares de 0 a 58, com CPU normal e redução de CPU em 6× via CDP. Mede tempo total por solicitação (inclui iniciar/encerrar o Worker) e maior atraso de um timer de 4 ms na thread principal. Também conta tarefas longas (≥50 ms) observadas na thread principal. É uma aproximação da responsividade, não uma medição de latência física do toque. A redução via CDP não reproduz todas as diferenças de hardware nem garante a mesma redução no Worker.

Resultado em Chromium headless, 30 sementes por cenário (milissegundos):

| CPU / caminho | Total p95 | Atraso do timer principal p95 | Tarefas longas na principal |
| --- | ---: | ---: | ---: |
| Normal / antes | 194,7 | 192,8 | 28 |
| Normal / otimizado síncrono | 86,4 | 86,0 | 11 |
| Normal / Worker | 120,9 | 3,4 | 0 |
| CDP 6× / antes | 1.135,2 | 1.135,3 | 30 |
| CDP 6× / otimizado síncrono | 603,6 | 607,4 | 30 |
| CDP 6× / Worker | 144,5 | 14,0 | 0 |

O Worker acrescenta inicialização e comunicação ao tempo total, mas retira a simulação da thread principal. O maior atraso de timer observado com Worker foi 3,6 ms em CPU normal e 51 ms em CDP 6×, mesmo sem tarefa longa observada nesse caminho. Isso não garante ausência absoluta de pausas. Os tempos totais do Worker sob CDP não devem ser interpretados como desempenho de um celular seis vezes mais lento: a emulação da página não reproduz de forma equivalente a capacidade de outra thread/hardware.

A suíte completa passou com 197 testes, incluindo Worker real via ponte `worker_threads`, igualdade de mapas, isolamento de `position()`/`snapshot()`, falha/cancelamento/timeout, respostas tardias, reinício e navegação durante preparação. A integração também foi exercitada em Chromium real: cancelamento enquanto o módulo carregava, configurações abertas durante preparação (modal preservado, teclas isoladas e nenhum jogo oculto), abertura da fase 4, erro de carregamento e nova tentativa, sem erro de página. Nenhuma destas verificações substitui teste em aparelho móvel físico.

### Controles

O arrasto precisa começar sobre a área de toque da bolinha; mover não lança. Soltar lança, mas cancelar o gesto ou perder a entrada não lança. O módulo não solicita pausa; o gerenciador de eventos trata interrupções do navegador. No teclado, mantenha uma seta e solte para dar força. No toque/mouse, arraste a partir da bolinha no sentido contrário e solte. Os trajetos gerados têm arrastos de referência inteiramente dentro do tabuleiro 96 × 96. O tamanho visual do canvas não altera coordenadas lógicas.

## Verificações

```sh
node --test tests/varanda-modos.test.mjs
```

- Luz: 30 capturas sem encerrar, teto de velocidade, três erros e regras clássicas;
- Gude: gesto inválido, cancelamento, força curta/longa e rejeição de mapas triviais;
- 500 sementes consecutivas: 463 origens, quatro quadrantes, três famílias, 24 sequências de direção e oito orientações;
- diversidade de ocupação das pedras medida numa grade 6 × 6, normalizada por rotação e reflexão: mudar alguns pixels ou espelhar o mesmo mapa não basta;
- 499 assinaturas de ocupação normalizadas distintas; 300 inícios e 77 alvos internos, pedras separadas e quantidades de três a sete verificadas;
- nenhum fallback nas 500 sementes; medição separada de 100 sementes em Node encontrou p95 de aproximadamente 17 ms, sem garantia equivalente em celular;
- validação pelo motor real com três frequências e perturbações de tempo;
- 500 certificados repetidos por arrasto/toque, sem sair do canvas;
- Pisca ultrapassa 12 rodadas sem vitória artificial e mantém último resultado completo ao errar;
- metas clássicas dos demais jogos preservadas; novas fases autorais de Gude certificadas;
- renderizadores exercitados com contexto instrumentado.

Testes automatizados não substituem inspeção visual em navegador nem teste físico em celular. Persistência e backup pertencem ao gerenciador central, sem alteração de esquema neste módulo.

## Acabamento visual

Luz de Varanda recebeu iluminação quadriculada, parede discreta e dorso legível; Três Petelecos ganhou grãos de terra, faces de pedras e reflexo da bolinha. Pisca no Mato conserva seu visual original.

Os detalhes usam a grade nativa de 96 × 96, cores chapadas e bordas sem suavização. São apenas desenho: não representam novos obstáculos nem mudam colisões, controles, fases ou saves. As propostas foram comparadas com renderizações do próprio `draw()` antes da aplicação.

## Visual original de Pisca restaurado

A primeira matriz dos vaga-lumes disponível no GitHub foi recuperada do commit `9cc7bbb` (PR #1), com 11 × 7 pixels e asas erguidas. Ela substitui a matriz intermediária de 10 × 6; o fundo com vegetação lateral continua sem o capim adicional. A reversão é restrita ao desenho dentro da partida. Ícones, Sem Parar, recordes, toque, sequência, duração da luz e os outros jogos permanecem intactos.

## Padrões adicionais: passagens escalonadas

O Caminho Novo mantém as famílias anteriores. Dois terços das sementes continuam produzindo exatamente o mapa anterior; no terço restante, tenta uma versão mais exigente antes de recorrer ao gerador conhecido.

Esta versão não reutiliza uma planta fixa: sorteia três segmentos, origens e destinos também internos, e cinco a oito pedras alongadas independentes, em direções diferentes. A folga de referência cai de seis para cinco pixels lógicos, ainda sujeita ao certificado completo. Há variantes de travessia e retorno; a física, a aparência, os controles e o limite de três petelecos não mudam.

Além da validação original, seis ensaios alteram a força de **um** dos três petelecos em −30% ou +30%. O mapa somente entra se pelo menos quatro desses ensaios falharem. Isso mede a necessidade de calibrar a força; não significa que todo caminho alternativo esteja excluído nem que a dificuldade subjetiva seja igual para todos. Os gestos corretos continuam validados com ±15 ms de teclado e ±0,25 pixel lógico no toque, a 30, 60 e 120 atualizações/s.

A busca continua limitada a 64 candidatos, com até 120 amostras de pedras por candidato. Se o padrão exigente não passar, usa o gerador anterior e seu fallback certificado, sem apresentar um mapa insolúvel. Nada é gerado por quadro.

Verificação do novo subconjunto (100 sementes múltiplas de três): 92 retornos e oito travessias, 66 inícios internos e 23 destinos internos; nenhuma queda para o gerador anterior nesta amostra. O teste exige pelo menos 75 configurações distintas após normalizar rotações/reflexões em uma grade de ocupação 6×6. Geração p95 aproximada de 22 ms neste ambiente, não uma garantia para celulares. Dez testes passam, incluindo 500 sementes gerais e hashes de regressão que conferem mapas anteriores byte a byte.


## Três Petelecos: três fases autorais revisadas

As dificuldades mantêm os mesmos IDs, três tentativas, controles e formato de progresso/backup. Apenas suas disposições foram redesenhadas. O histórico antigo continua associado à mesma dificuldade; não é apagado nem recalculado.

| Dificuldade | Início | Buraco | Pedras | Percurso de referência e intenção |
| --- | --- | --- | --- | --- |
| Sossegado | (69,29) | (22,80) | 3 | Esquerda 47, baixo 51: uma curva ampla, solução em dois tiros e um tiro de reserva. |
| Animado | (54,29) | (52,69) | 4 | Direita 21, baixo 40, esquerda 23: contornar o bloqueio central e voltar, usando os três tiros e forças diferentes. |
| Puxado | (53,66) | (15,45) | 5 | Cima 47, esquerda 38, baixo 26: retorno escalonado, obstáculos alongados e mudanças de direção/força. |

Coordenadas e distâncias usam o tabuleiro lógico 96×96. Os caminhos acima são certificados, não movimentos automáticos. A progressão vem da quantidade de decisões, da ausência de tiro de reserva nas duas últimas fases e da disposição dos obstáculos, não da alteração artificial da física. Não se afirma que seja a única solução nem que a dificuldade subjetiva seja idêntica para todas as pessoas.

Cada fase passa pelo mesmo motor com controles de teclado/toque, tolerância de ±15 ms e ±0,25 pixel lógico, a 30/60/120 atualizações por segundo. Os testes verificam também vitória única, três/quatro/cinco pedras e soluções com dois/três/três tiros. O teste genérico de força/cancelamento usa um terreno de controle explícito para não confundir a mecânica com a nova disposição das fases.

## Luz de Varanda: limite de erros em todas as dificuldades

Sossegado, Animado e Puxado conservam metas de 2, 3 e 4 mosquitos e prazos de 25, 24 e 23 segundos. Agora também perdem no terceiro bote sem captura. O HUD mostra tempo, meta e erros restantes. O erro só é contabilizado quando o bote termina; repetir comandos durante a mesma animação não consome tentativas adicionais. A derrota informa “Três botes errados”. Acertar não recupera tentativas. A meta ainda vence antes do prazo com até dois erros.

Sem Parar mantém sua regra de três erros e não recebe cronômetro. Reiniciar zera erros, tempo e capturas; as demais regras, arte, controles, IDs, saves e backups permanecem. `tests/luz-erros.test.mjs` cobre os três níveis, entradas por toque e teclado no motor, contagem única, bloqueio após terminar, vitória com dois erros, derrota por tempo e reinício. Não constitui teste de aparelho físico.
