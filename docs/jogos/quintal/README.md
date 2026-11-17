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

O gerador usa um PRNG determinístico e tenta no máximo 48 candidatos. Para cada candidato, uma busca em largura considera **posição, número de passos módulo seis e última posição segura em areia**. Ela reproduz as regras reais: bloquear baixios na maré alta, alterar a maré a cada três passos, retornar à última areia se a subida ocorrer sobre um baixio e reconhecer a concha antes da mudança de maré.

A referência é a própria fase **Puxado**: solução mínima de 17 comandos, contra 14 sem maré, e dois baixios individualmente indispensáveis. Cada mapa deve exigir **17 a 27 comandos**, custo adicional da maré de **pelo menos três comandos** e **dois baixios obrigatórios** (bloquear qualquer um impede chegar à concha). Além disso, remover as pedras precisa reduzir o caminho mínimo: pedras meramente decorativas não satisfazem esse critério. Essas verificações rejeitam atalhos secos e mapas solucionáveis sem lidar com o ciclo da maré.

O gerador faz mutações locais do mapa autoral, incluindo acessos e obstáculos, e oito orientações possíveis. Não é um gerador irrestrito: conserva deliberadamente a escala e a estrutura de desafio do Puxado. Em 300 sementes verificadas houve 299 mapas e 49 sequências de solução distintos, com 17 a 23 comandos. Comparabilidade aqui é medida por essas métricas de regras, não uma promessa de dificuldade subjetiva idêntica. Após o limite de tentativas, um corredor fixo validado sob os mesmos critérios (também orientado pela semente) fornece uma saída segura. O retorno contém a semente, a solução e a indicação de fallback. Reiniciar com a mesma semente reproduz a mesma fase; gerar outra é responsabilidade do aplicativo. A solução não depende de física nem de tempo de reação: o jogo avança por comandos discretos.

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
