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

`criarTerrenoGude(seed)` usa um gerador determinístico. A semente reconstrói alvo, pedras e certificado de solução com até três petelecos. As fases autorais não mudam. O gerenciador deve conservar a semente ao tentar novamente e fornecer outra somente ao pedir nova fase.

O certificado não é apenas conectividade: `validarTerrenoGude()` instancia **o mesmo jogo**, pressiona e solta controles públicos e executa a física real, incluindo alcance carregado, desaceleração, ricochetes, colisões e raio do buraco. Verifica 30, 60 e 120 atualizações/s e oito combinações de erro de ±15 ms ao soltar os três gestos. Também repete o certificado por arrasto com perturbação de ±0,25 pixel lógico em ambos os eixos, nas mesmas frequências, verificando que o gesto cabe no tabuleiro. Geração limitada a 32 tentativas, seguida de percurso seguro também validado. Se até ele falhar, lança erro em vez de apresentar mapa sem certificado.

Como referência mensurável do Puxado, exige pelo menos duas pedras e área total de obstáculos de 360 pixels quadrados (duas pedras autorais de 15 × 12). Rejeita mapas em que mirar diretamente no buraco vence com qualquer alcance inteiro de 3 a 94, incluindo os ricochetes dessa tentativa. Isso exige trabalhar direção e força; não prova equivalência subjetiva de dificuldade. O certificado usa duas famílias distintas: travessia (continua ao outro lado após contornar) e retorno (contorna uma barreira e volta para um alvo do lado inicial). Cada uma admite oito rotações/reflexões, alterando também posições, controles e pedras. A origem varia nos quatro quadrantes; não fica mais presa em [16,80]. Duas a quatro pedras variam em posição, proporção e composição. O jogador pode encontrar outra solução; não há autopiloto. A variedade limita-se deliberadamente a estas duas famílias de trajetos validáveis, não a qualquer labirinto arbitrário. A prova garante a existência de uma sequência executável, não a vitória com qualquer força ou caminho.

### Controles

O arrasto precisa começar sobre a área de toque da bolinha; mover não lança. Soltar lança, mas cancelar o gesto ou perder a entrada não lança. O módulo não solicita pausa; o gerenciador de eventos trata interrupções do navegador. No teclado, mantenha uma seta e solte para dar força. No toque/mouse, arraste a partir da bolinha no sentido contrário e solte. Os trajetos gerados têm arrastos de referência inteiramente dentro do tabuleiro 96 × 96. O tamanho visual do canvas não altera coordenadas lógicas.

## Verificações

```sh
node --test tests/varanda-modos.test.mjs
```

- Luz: 30 capturas sem encerrar, teto de velocidade, três erros e regras clássicas;
- Gude: gesto inválido, cancelamento, força curta/longa e rejeição de mapas triviais;
- 400 sementes consecutivas: 229 origens distintas, quatro quadrantes, 16 sequências de direções e oito orientações;
- 210 travessias e 190 retornos; 127 mapas com duas pedras, 138 com três e 135 com quatro; nenhum fallback nessa amostra;
- geração p95 de aproximadamente 16 ms nas primeiras 100 sementes no ambiente de teste (não é promessa de desempenho em celular);
- validação pelo motor real com três frequências e perturbações de tempo;
- 400 certificados repetidos por arrasto/toque, sem sair do canvas;
- Pisca ultrapassa 12 rodadas sem vitória artificial e mantém último resultado completo ao errar;
- metas clássicas e alvos autorais preservados;
- renderizadores exercitados com contexto instrumentado.

Testes automatizados não substituem inspeção visual em navegador nem teste físico em celular. Persistência e backup pertencem ao gerenciador central, sem alteração de esquema neste módulo.

## Acabamento visual aprovado

Luz de Varanda recebeu iluminação quadriculada, parede discreta e dorso legível; Três Petelecos ganhou grãos de terra, faces de pedras e reflexo da bolinha. Pisca no Mato conserva seu visual original.

Os detalhes usam a grade nativa de 96 × 96, cores chapadas e bordas sem suavização. São apenas desenho: não representam novos obstáculos nem mudam colisões, controles, fases ou saves. As propostas foram comparadas com renderizações do próprio `draw()` antes da aplicação.

## Visual original de Pisca restaurado

O refinamento visual de Pisca do PR #29 foi retirado: voltaram a matriz original dos vaga-lumes e o fundo com vegetação lateral, sem o capim adicional. A reversão é restrita ao desenho dentro da partida. Ícones, Sem Parar, recordes, toque, sequência, duração da luz e os outros jogos permanecem intactos.
