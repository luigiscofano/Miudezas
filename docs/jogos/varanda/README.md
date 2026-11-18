# Varanda: luz, bolinha e memória

Implementação: [`dist/varanda.js`](../../../dist/varanda.js). Os modos respeitam o desenho em pixels e os controles anteriores.

| Jogo | Modos | Justificativa |
| --- | --- | --- |
| Luz de Varanda | Dificuldades autorais e Sem Parar | Botes errados passam a consumir três tentativas exclusivamente no novo modo; capturas medem o recorde. |
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

## Acabamento visual aprovado

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
