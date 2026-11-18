# Testes de comportamento e compatibilidade

Execute na raiz com Node moderno, sem pacotes externos:

```sh
node --test tests/*.test.mjs
```

| Arquivo | Cobertura |
|---|---|
| `navegacao.test.mjs` | Galeria, catálogo ativo, migração por IDs, sequência e resumo das dez paradas em navegador simulado. |
| `recordes.test.mjs` | IDs elegíveis, inteiros seguros e atualização somente ao superar o melhor resultado. |
| `backup.test.mjs` | Exportação/importação, validação de entradas e compatibilidade do progresso. |
| `capa.test.mjs` | Dimensões do PNG, proporção preservada e título acessível sem sobreposição. |
| `pao.test.mjs` | Três dificuldades em 30/60/120 atualizações/s, identidades, utensílios, toque, reposições, troca, erro único, derrota e reinício. |
| `esquina-modos.test.mjs` | Metas separadas e vitória imediata; 20 minutos de Sem Parar; geração de Rastro e execução de soluções pelos controles reais; consulte os testes para o lote e os critérios atuais. |
| `quintal-modos.test.mjs` | Quarta/quinta gotas, alagamento, limites, Pipa contínua e colisão, Último Fio contínuo, 300 sementes de Maré com estados reais: 17–27 passos, custo de maré mínimo 3, dois baixios obrigatórios e pedras que bloqueiam atalhos. |
| `varanda-modos.test.mjs` | Pisca contínuo; Luz contínua com derrota no terceiro bote errado; Gude com soluções executadas pelos controles e física. Consulte o arquivo para os lotes e critérios atuais. |
| `pracinha.test.mjs` | Regressões do código legado e integridade do catálogo. Peteca/Gato não voltam ao aplicativo por esses testes. |

Os geradores são testados pela execução da solução no jogo, não só por verificar conectividade abstrata. Sementes determinísticas permitem reproduzir uma falha. Testes de partidas longas conferem continuidade e encerramento único; não equivalem a um benchmark em todos os celulares.

## Verificação manual complementar

- Abrir o catálogo e completar a volta sem entradas para jogos removidos.
- Usar teclado, botões acessíveis e toque, incluindo escolha de utensílio.
- Iniciar o traçado de Rastro no caracol; começar fora dele não deve mover.
- Iniciar o arrasto de Gude na bola; testar fora dela, soltura válida, `pointercancel` e perda de foco. Cancelamento não lança.
- Confirmar que somente o tabuleiro captura os gestos necessários; fora dele a página continua rolável.
- Na pausa, Voltar às fases conserva seleção, saves e recordes.
- Em Luz Sem Parar, sobreviver além dos tempos autorais e perder somente no terceiro bote errado.
- Conferir pausa ao ocultar aba, reinício, resultado, recorde e recarregamento.
- Repetir fase gerada e depois pedir outra, observando a semente.
- Exportar e importar backup antigo e novo sem trocar resultados entre jogos.
- Inspecionar colisões/desenhos, legibilidade do HUD e controles em tela estreita.

A suíte automatizada não substitui inspeção visual, teste em aparelho real nem verificação da versão publicada. Registre no PR quais verificações foram de fato executadas.

[Manual principal](../README.md)

## Verificação integrada de gestos e pausa

Execute a suíte completa para conferir a contagem atual. `navegacao.test.mjs` liga o Gude real ao canvas instrumentado e despacha ponteiros: puxar mantém a partida, cancelamento não lança, soltar lança. Eventos de foco transitório, perda real de foco, aba oculta, captura perdida e retorno às fases são verificados separadamente. Isso é automação DOM, não sessão em navegador móvel físico. O cancelamento do pad também solta direções contínuas sem disparar um peteleco.

Medição Node de 100 sementes, sem aquecimento: p95 de geração Rastro 7,56 ms, Maré 12,89 ms e Gude 10,99 ms. O máximo observado em Gude foi 71,14 ms; a mesma semente repetida ficou entre 2,86 e 24,08 ms. São amostras deste ambiente, não garantias para celulares. A validação ocorre ao criar a fase, nunca a cada quadro.

## Diversidade dos caminhos

Gude é verificado por posições iniciais, quadrantes, famílias de rota, orientações e sequências de direção, além do certificado físico. Em 400 sementes desta revisão: 229 origens, quatro quadrantes, 16 sequências e nenhum fallback. Isso evita considerar simples deslocamentos de pedras como diversidade suficiente.

Rastro preserva a família estreita e acrescenta a aberta. Mil sementes resultaram em 667 mapas da família estreita e 333 da aberta, com 985 mapas únicos; 16 das abertas usaram fallback próprio (4,8%). O banco aberto possui dois modelos e oito orientações. A suíte inclui execução por gesto de 200 mapas abertos e regressão de 100 sementes estreitas. A área livre e as bifurcações são critérios verificáveis; dificuldade subjetiva ainda depende de teste humano.

`mare-arte.test.mjs` confere os pixels da arte aprovada e que desenhar não modifica o estado da partida.

### Pipa: movimento obrigatório nas fases

Os testes comparam as três dificuldades: nenhuma vence sem comandos, e uma trajetória com correções para cima e para baixo atravessa todas as passagens a 30, 60 e 120 Hz. A progressão de velocidade e margem é verificada explicitamente. A regressão de quatro minutos do Sem Parar permanece, pois sua configuração não foi alterada. Esses testes executam a simulação e os controles do jogo, mas não substituem avaliação de conforto por uma pessoa no celular.

`quintal-arte.test.mjs` verifica cores características da arte aprovada, coordenadas finitas e ausência de mutação de estado/HUD durante o desenho. São testes de renderização isolada, não testes de aparelho físico.

`esquina-arte.test.mjs` verifica cores características da arte aprovada, coordenadas finitas e ausência de mutação de estado/HUD durante o desenho. São testes de renderização isolada, não testes de aparelho físico.

`varanda-arte.test.mjs` verifica cores características da arte aprovada, coordenadas finitas e ausência de mutação de estado/HUD durante o desenho. São testes de renderização isolada, não testes de aparelho físico.

`pisca-rastro-arte.test.mjs` verifica as três matrizes de folhas, a paleta, o fundo original de Pisca e a preservação do estado ao desenhar.

`mare-rastro-refinamento.test.mjs` confere cores características dos dois refinamentos, desenho com coordenadas finitas, estado imutável e fases geradas com quatro sementes. Os testes são automatizados; não representam teste em aparelho físico.

### Ícones aprovados

`navegacao.test.mjs` verifica a galeria nas duas páginas: apenas Rádio, Gude, Pisca, Luz, Maré, Fio e Rastro recebem os SVGs aprovados, os três restantes preservam os PNGs e `foto()` fora da seleção conserva as cenas. Execute `node --test tests/*.test.mjs`. A inspeção local dos sete SVGs também comparou seus pixels com as artes aprovadas. Essa comparação não equivale a teste em aparelho físico.

`rastro-vaso.test.mjs` verifica dimensões de 11 × 10 pixels, permanência dentro da casa P nas três dificuldades e em cinco sementes geradas, além da preservação do estado e da solução durante o desenho.


### Pão francês aprovado

Pão na Chapa usa a versão aprovada baseada na referência enviada: pão francês alongado, com dois cortes diagonais e cores chapadas. O sprite tem 13 × 16 pixels, desenhado em escala 2 na chapa. As quatro paletas mostram antes do ponto, no ponto, tostado e queimado, preservando a fumaça. Ovo, utensílios, áreas de toque, tempos, metas, reposições e alternância de lados não mudam. Os testes de identidade verificam o novo desenho em ambos os lados; a suíte mantém os testes dos três níveis, vitória, queima e três erros.
