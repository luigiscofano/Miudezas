# Testes de comportamento e compatibilidade

Execute na raiz com Node moderno, sem pacotes externos:

```sh
node --test tests/*.test.mjs
```

| Arquivo | Cobertura |
|---|---|
| `navegacao.test.mjs` | Galeria, catálogo ativo, migração por IDs, sequência e resumo das dez paradas em navegador simulado. |
| `nomes-fases.test.mjs` | Rótulos atualizados de Goteira e Último Fio, conservando os IDs e a ordem das dificuldades. |
| `recordes.test.mjs` | IDs elegíveis, inteiros seguros e atualização somente ao superar o melhor resultado. |
| `backup.test.mjs` | Exportação/importação, validação de entradas e compatibilidade do progresso. |
| `capa.test.mjs` | Dimensões do PNG, proporção preservada e título acessível sem sobreposição. |
| `pao.test.mjs` | Três dificuldades em 30/60/120 atualizações/s, identidades, utensílios, toque, reposições, troca, erro único, derrota e reinício. |
| `esquina-modos.test.mjs` | Metas separadas e vitória imediata; 20 minutos de Sem Parar; geração de Rastro e execução de soluções pelos controles reais; consulte os testes para o lote e os critérios atuais. |
| `quintal-modos.test.mjs` | Quarta/quinta gotas, alagamento, limites, Pipa contínua e colisão, Último Fio contínuo, 300 sementes de Maré com estados reais e critérios separados para famílias anteriores e avançadas; pedras devem bloquear atalhos. |
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

Gude é verificado por posições iniciais, quadrantes, famílias de rota, orientações e sequências de direção, além do certificado físico. O lote atual de 500 sementes exige três famílias, 24 sequências, inícios e alvos internos e pedras independentes. A assinatura de ocupação 6 × 6 normalizada por rotações/reflexões verifica variedade estrutural, não apenas coordenadas ou espelhos diferentes. Consulte os limites executáveis em `varanda-modos.test.mjs`.

Rastro preserva a família estreita e acrescenta a aberta. Mil sementes resultaram em 667 mapas da família estreita e 333 da aberta, com 985 mapas únicos; 16 das abertas usaram fallback próprio (4,8%). O banco aberto possui dois modelos e oito orientações. A suíte inclui execução por gesto de 200 mapas abertos e regressão de 100 sementes estreitas. A área livre e as bifurcações são critérios verificáveis; dificuldade subjetiva ainda depende de teste humano.

`mare-arte.test.mjs` confere os pixels da arte e que desenhar não modifica o estado da partida.

### Pipa: movimento obrigatório nas fases

Os testes comparam as três dificuldades: nenhuma vence sem comandos, e uma trajetória com correções para cima e para baixo atravessa todas as passagens a 30, 60 e 120 Hz. A progressão de velocidade e margem é verificada explicitamente. A regressão de quatro minutos do Sem Parar permanece, pois sua configuração não foi alterada. Esses testes executam a simulação e os controles do jogo, mas não substituem avaliação de conforto por uma pessoa no celular.

`quintal-arte.test.mjs` verifica cores características da arte, coordenadas finitas e ausência de mutação de estado/HUD durante o desenho. São testes de renderização isolada, não testes de aparelho físico.

`esquina-arte.test.mjs` verifica cores características da arte, coordenadas finitas e ausência de mutação de estado/HUD durante o desenho. São testes de renderização isolada, não testes de aparelho físico.

`varanda-arte.test.mjs` verifica cores características da arte, coordenadas finitas e ausência de mutação de estado/HUD durante o desenho. São testes de renderização isolada, não testes de aparelho físico.

`pisca-rastro-arte.test.mjs` verifica as três matrizes de folhas, a paleta, o fundo original de Pisca e a preservação do estado ao desenhar.

`mare-rastro-refinamento.test.mjs` confere cores características dos dois refinamentos, desenho com coordenadas finitas, estado imutável e fases geradas com quatro sementes. Os testes são automatizados; não representam teste em aparelho físico.

### Ícones

`navegacao.test.mjs` verifica a galeria nas duas páginas: Rádio, Gude, Pisca, Luz, Maré, Fio, Rastro, Goteira, Pipa e Pão recebem os SVGs e `foto()` fora da seleção e da pausa conserva as cenas. Execute `node --test tests/*.test.mjs`. A inspeção local dos dez SVGs também comparou seus pixels com as artes. Essa comparação não equivale a teste em aparelho físico.

`rastro-vaso.test.mjs` verifica dimensões de 11 × 10 pixels, permanência dentro da casa P nas três dificuldades e em cinco sementes geradas, além da preservação do estado e da solução durante o desenho.


### Pão francês

Pão na Chapa usa um sprite de pão francês alongado, com dois cortes diagonais e cores chapadas. O sprite tem 13 × 16 pixels, desenhado em escala 2 na chapa. As quatro paletas mostram antes do ponto, no ponto, tostado e queimado, preservando a fumaça. Ovo, utensílios, áreas de toque, tempos, metas, reposições e alternância de lados não mudam. Os testes de identidade verificam o novo desenho em ambos os lados; a suíte mantém os testes dos três níveis, vitória, queima e três erros.


### Tela de pausa coesa

A pausa usa a mesma imagem da seleção: ícone quando disponível e miniatura original nos demais jogos. A imagem é contida sem recorte. “Continuar” e “Voltar às fases” permanecem na primeira linha; “Voltar ao menu” ocupa a segunda linha, centralizado e com a mesma largura dos demais botões. O ajuste é exclusivo da pausa e mantém navegação, progresso e controles. O teste de navegação verifica a arte e as três ações dos dez jogos.

### Goteira, Pipa e Pão na Chapa: últimos ícones

Os dois ícones usam a grade de 24 × 24 pixels, ampliada sem suavização: balde com alça simples e pipa inclinada. São compartilhados pela seleção e pela pausa; não alteram cenas jogáveis, colisões, controles ou saves. Pão na Chapa usa a versão intermediária de 32 × 32 pixels, com pão francês e ovo baseados nos sprites reais.

## Novas famílias de Caminho Novo e progressão de Gude

- `mare-padroes.test.mjs`: regressão da geração anterior, 100 enseadas irregulares, topologias normalizadas e execução das soluções com maré.
- `rastro-padroes.test.mjs`: regressão estreita/aberta, 300 mapas irregulares, rejeição de atalhos e ordens inviáveis, gestos completos e tratamento de busca inconclusiva.
- `varanda-modos.test.mjs`: preservação das sementes antigas, percursos escalonados e sensibilidade à força, além dos certificados das três dificuldades clássicas.
- `navegacao.test.mjs`: o gesto integrado começa na posição real da bolinha, sem presumir uma origem antiga fixa.

Os testes executam o motor e os controles públicos em automação. Isso não equivale a validação em telefone físico; a comparação visual usa renderizações do próprio `draw()`.

### Maré: muito difícil e muitíssimo difícil

`mare-extrema.test.mjs` verifica lotes das duas faixas avançadas, execução das soluções no motor real, repetibilidade, critérios de planejamento e diversidade normalizada (sem contar rotações/reflexões como mapas distintos). A suíte mantém a regressão das famílias anteriores e o Puxado escolhido pela imagem. Esses critérios estimam dificuldade estrutural; não certificam a percepção de dificuldade por uma pessoa nem desempenho em todo aparelho.

## Pipa em V

`pipa-aves.test.mjs` verifica simetria e quantidade das aves, compara colisão com todos os pixels sólidos e confirma ausência de barreira invisível no interior do V. Simula dez minutos de Sem Parar em cada dificuldade, mantendo a lista de obstáculos limitada. `quintal-modos.test.mjs` também verifica vitória com controle ativo em 30/60/120 Hz, derrota parado e após acomodar na primeira passagem, encerramento único e velocidades/margens. São testes da lógica, não toque em aparelho físico.

### Lagartixa: três erros em todos os níveis

`luz-erros.test.mjs` executa cada dificuldade: erro contado após um bote, entradas repetidas ignoradas durante a animação, derrota única no terceiro erro, estado congelado após terminar, reinício, vitória com dois erros e prazo preservado. Também confirma que Sem Parar continua sem limite de tempo. As entradas usam os métodos reais do jogo; não substituem teste de toque em aparelho físico.

### Auditoria documental

O teste da lagartixa também verifica se o catálogo informa o terceiro erro em qualquer modo, mantendo o prazo autoral. A reorganização documental confere links e âncoras locais, referências de imagens, decodificação de PNGs e XML dos SVGs; imagens armazenadas não são apresentadas como capturas novas. Essa auditoria não substitui teste visual do Markdown renderizado pelo GitHub.

## Imagens atuais da documentação

`cenas-documentacao.test.mjs` compara as dez imagens versionadas com uma nova renderização das fábricas reais, confere repetibilidade e a transformação espelhada do caracol. Execute o gerador de cenas após mudanças visuais intencionais, inspecione os resultados e mantenha as imagens no mesmo PR.


### Enquadramento dos jogos no computador

Em dispositivos com mouse, a largura da janela durante a partida acompanha a altura livre do tabuleiro quadrado. Isso remove as faixas laterais sem esticar os pixels, cortar a cena ou mudar coordenadas de controle. O ajuste reage ao redimensionamento e à altura do HUD, e é desfeito ao pausar ou voltar aos menus. Telas de toque mantêm o enquadramento anterior. Os testes de navegação cobrem os dez jogos, larguras de 492 a 1920 pixels, saída/retomada e preservação do toque; a simulação DOM não substitui avaliação em aparelho físico.

### Pote de Rastro de Prata

`rastro-vaso.test.mjs` confere o sprite de 12 × 10 pixels visíveis dentro do destino nas três dificuldades e em sementes geradas, a ausência da faixa clara somente nessa casa e a preservação do estado após desenhar.

## Acervo de elementos visuais

`elementos-visuais.test.mjs` verifica cobertura dos dez jogos, correspondência de cada SVG e prancha com o motor, cobertura de todos os retângulos emitidos, determinismo e erros de entrada.

## Áudio e configurações

`audio.test.mjs`: inventário de nove faixas/nove efeitos, mute, ausência de autoplay/rede antes de gesto, reutilização/cache limitado, troca obsoleta, falha de rede, suspensão e limite de vozes. Contexto Web Audio simulado. `configuracoes.test.mjs`: normalização/persistência de volumes, restauração, diálogo, Escape e foco em DOM simulado. `backup.test.mjs`: schema 3, volumes e compatibilidade v1/v2.

Nesta entrega, a suíte inteira passou com 175 testes. Chromium local não pôde iniciar por restrição de socket/processo do ambiente; não houve teste em aparelho físico. Não confundir simulação de autoplay com validação no Safari/iOS. Os 18 arquivos foram verificados por decodificação; a escuta musical complementou as verificações técnicas.

O teste do Sobre verifica os fatos familiares, a atribuição a Gabriel Fonseca, o link de referência protegido e a manutenção da orientação sobre backup local. Usa DOM simulado; não equivale a teste em aparelho físico.
