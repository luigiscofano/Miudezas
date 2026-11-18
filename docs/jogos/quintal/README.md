# Modos do quintal

O módulo `dist/quintal.js` desenha as cenas na grade original de 96 × 96 pixels. As fases autorais continuam disponíveis. Não há migração destrutiva de dados neste módulo: o aplicativo persiste os recordes e fornece `mode` e `seed` às fábricas.

| Jogo | Modo adicional | Razão e pontuação |
|---|---|---|
| Goteira | Sem Parar | Gotas contínuas, derrota natural por alagamento; gotas recolhidas, não as transbordadas. |
| Pipa | Sem Parar | Obstáculos contínuos; quantidade ultrapassada até uma colisão. |
| Fio de Varal | Sem Parar | Mariposas sucessivas e rajadas; quantidade recolhida antes de ser levado. |
| Maré Miúda | Caminho Novo | Percurso com objetivo definido e estado de maré; outra semente gera outra fase. |

## Goteira

O balde guarda no máximo quatro gotas. A quinta transborda e é imediatamente retirada da lista de gotas ativas. Gotas que chegam diretamente ao chão também contam uma vez. O piso molhado cresce até os limites: **12 no Sossegado, 9 no Animado, 6 no Puxado e 8 no Sem Parar**. O resultado “O chão alagou!” encerra a simulação uma única vez. O descarte lateral original continua esvaziando o balde. Os modos autorais conservam seu objetivo original por tempo; Sem Parar não termina aos 60 segundos. A cadência contínua tem intervalo mínimo de 1,35 s e velocidade máxima de 36 pixels/s.

## Pipa

Casario estreito com janelas altas, telhas em pixels e morros ao fundo distingue o cenário carioca. Postes e pássaros escuros são obstáculos; casas e morros são decorativos. Não existe mais a tampa superior de fios. As colisões usam envelopes conservadores do corpo e da rabiola, não colisão perfeita por pixel. Postes mantêm seus isoladores e o pássaro ocupa o teto da passagem.

Nas três fases autorais, passagens altas e baixas alternam seus centros entre as alturas 22 e 46. Pequenos bandos acima e postes abaixo delimitam aberturas sem uma altitude fixa segura. Sossegado, Animado e Puxado usam velocidades de 14, 17 e 20 pixels/s, respectivamente, e margens verticais de 8, 7 e 6 pixels em torno do centro; o número de obstáculos continua 4, 5 e 6. Há 70 pixels entre obstáculos para permitir reposicionamento. Os testes verificam derrota sem comandos e trajetórias vencedoras que sobem e descem, a 30/60/120 Hz.

O modo **Sem Parar não foi recalibrado nesta revisão**: mantém seu corredor próximo da altura 22, progressão e velocidade limitada a 23 pixels/s. Sua simulação de quatro minutos continua aprovada. Obstáculos que saíram da tela são descartados; o total ativo permanece limitado. Subpassos de no máximo 25 ms evitam atravessar obstáculos por um quadro lento.

## Fio de Varal

As cinco posições de mariposas se repetem, sem vitória automática na quinta. Uma rajada na fileira ocupada termina a partida. A janela de aviso nunca cai abaixo de 0,9 s e o intervalo entre rajadas não fica menor que 2,8 s. A frequência sonora também é limitada para não crescer indefinidamente com o placar.

## Maré Miúda: prova executável de solução

A família original, preservada em dois terços das sementes, usa um PRNG determinístico e tenta no máximo 48 candidatos. A família adicional é descrita abaixo. Para cada candidato, uma busca em largura considera **posição, número de passos módulo seis e última posição segura em areia**. Ela reproduz as regras reais: bloquear baixios na maré alta, alterar a maré a cada três passos, retornar à última areia se a subida ocorrer sobre um baixio e reconhecer a concha antes da mudança de maré.

A referência é a própria fase **Puxado**: solução mínima de 17 comandos, contra 14 sem maré, e dois baixios individualmente indispensáveis. Cada mapa deve exigir **17 a 27 comandos**, custo adicional da maré de **pelo menos três comandos** e **dois baixios obrigatórios** (bloquear qualquer um impede chegar à concha). Além disso, remover as pedras precisa reduzir o caminho mínimo: pedras meramente decorativas não satisfazem esse critério. Essas verificações rejeitam atalhos secos e mapas solucionáveis sem lidar com o ciclo da maré.

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

A matriz aprovada tem 11 × 8 pixels e fica dentro de cada casa de 12 × 12. Pinças, olhos e carapaça permanecem legíveis sem suavização. O espelhamento e o clarão de retorno à areia são preservados. Movimento, maré, mapas e persistência não dependem dessa matriz.

## Acabamento visual aprovado

Goteira recebeu moldura da janela, piso e reflexos no balde; Último Fio ganhou nuvens e telhados; Pipa de Laje recebeu uma segunda camada de morros e detalhes de fachadas e lajes. A dificuldade recém-recalibrada da Pipa permanece intacta. A arte aprovada do caranguejo já estava publicada e não foi duplicada.

Os detalhes usam a grade nativa de 96 × 96, cores chapadas e bordas sem suavização. São apenas desenho: não representam novos obstáculos nem mudam colisões, controles, fases ou saves. As propostas foram comparadas com renderizações do próprio `draw()` antes da aplicação.

### Maré: segunda prévia aprovada

A costa recebe espuma em um pixel apenas no encontro com areia. Pequenos pontos sugerem areia, riscos diferenciam baixios, pedras ganham faces e a concha recebe preenchimento claro. O caranguejo aprovado é preservado. Nenhum detalhe cria passagem ou obstáculo: a matriz de terreno continua sendo a única fonte de colisões e movimentos.

## Novos padrões: enseadas irregulares

A ampliação **preserva a família anterior**: sementes cujo resto por três é 1 ou 2 usam exatamente o gerador precedente. Sementes divisíveis por três recebem a família `enseada-irregular`. Fases autorais, desenho, controles e armazenamento não mudam. As sementes da nova família representam mapas novos; o algoritmo não promete reproduzir mapas de versões antigas para esse subconjunto.

Em vez de apenas mudar pedras no corredor diagonal, a nova família constrói um caminho autoevitante, com início e concha em posições variáveis, curvas e retornos. O corredor não pode tocar lateralmente em si mesmo, evitando atalhos acidentais. Depois insere travessias rasas e pedras; somente a validação completa decide se o candidato pode ser entregue.

Cada enseada nova exige **23 a 27 comandos na solução mínima**, **pelo menos cinco comandos adicionais devido à maré** e **três baixios individualmente obrigatórios**. Retirar as pedras deve encurtar a solução. São limites mais exigentes que os mínimos anteriores (17 comandos, custo de maré 3 e dois baixios), sem aumentar a velocidade nem exigir reflexos: a maré continua avançando somente por movimentos válidos. Mais planejamento é medido por esses critérios, não por uma promessa de dificuldade subjetiva universal.

A busca certificadora inclui posição, fase do ciclo e última areia segura, tal como a partida. A geração tenta no máximo **96 candidatos** e, se necessário, escolhe entre quatro reservas irregulares, orientadas pela semente e verificadas pelos mesmos critérios. O fallback não é uma fase fácil sem maré.

`node --test tests/mare-padroes.test.mjs` verifica hashes de seis sementes antigas, reprodução e reinício, execução das soluções em 100 novas sementes e uso de reservas. No lote 0, 3, …, 297 houve **95 topologias distintas**, mesmo removendo pedras decorativas e normalizando rotações/reflexões, com 55 posições iniciais e 38 posições de concha; oito sementes usaram reserva. A diversidade é de percurso, não só de orientação ou cor.

Esses testes exercitam lógica discreta. Não constituem avaliação humana de dificuldade nem benchmark de todos os celulares; os limites de tentativas evitam buscas ilimitadas, mas o custo de geração ainda varia com o dispositivo.
