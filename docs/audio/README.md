# Identidade sonora do Miudezas

A trilha combina leveza de videogame, harmonia com sétimas e nonas, síncopes brasileiras, cordas dedilhadas sintetizadas e percussão delicada inspirada em madeira, ganzá e platinelas. O objetivo é acompanhar o bairro e seus jogos sem transformar a experiência em uma sequência de alarmes.

A direção musical aprovada é **Interpretação Mais Natural**. Os efeitos aprovados pertencem à **V2 instrumental**. As imagens desta pasta documentam os arquivos dessa direção, e não as alternativas anteriores.

---

## Música por tipo de tela

| Tela | Tema | Andamento | Duração do ciclo |
|---|---|---:|---:|
| Início | Janela na Tijuca | 74 BPM | 25,95 s |
| Catálogo | Passeio no Bairro | 78 BPM | 24,62 s |
| Seleção de níveis | Uma Coisa de Cada Vez | 74 BPM | 25,95 s |
| Partida | Balanço de Quintal | 80 BPM | 24,00 s |
| Pausa | Sombra na Varanda | 66 BPM | 29,09 s |
| Roteiro da Volta no Bairro | Volta no Bairro | 78 BPM | 24,62 s |
| Próxima parada | Ali na Esquina | 76 BPM | 25,26 s |
| Resultado | Respira e Tenta | 68 BPM | 28,24 s |
| Resumo da Volta no Bairro | De Volta em Casa | 72 BPM | 26,67 s |

Cada ciclo tem oito compassos de quatro tempos. A identidade harmônica é compartilhada; andamento, interpretação, distribuição das notas e densidade diferenciam os contextos. A pausa não tem a camada de percussão dos demais temas.

### Interpretação e timbres

- O baixo usa síntese senoidal com um harmônico discreto.
- A melodia e os acordes combinam o timbre eletrônico suave com uma camada de corda amortecida por realimentação, inspirada na família Karplus–Strong.
- O gesto musical não é rigidamente quantizado: há pequenas antecipações, atrasos, mudanças de intensidade e abertura temporal entre as notas dos acordes.
- Os finais das respostas melódicas são mais curtos; os inícios de frase recebem mais presença.
- O ambiente é curto. A repetição de ataque em atraso fixo foi retirada para não criar uma resposta mecânica à melodia.

Isso é **síntese com interpretação programada**, não gravação de músicos ou instrumentos acústicos reais. Os sons foram produzidos a partir do código, sem samples externos. A textura remete a instrumentos, sem alegar uma execução acústica.

---

## Formas de onda das músicas

![Formas de onda das nove músicas, em escala comum de amplitude](ondas-musicas.png)

Os gráficos leem diretamente os WAV individuais do compositor. Mostram o envelope mínimo/máximo do **canal esquerdo**, em blocos de amostras, preservando os picos desses blocos. A escala vertical é a mesma em todos: amplitude PCM entre −1 e +1. Não há normalização individual para fazer uma faixa parecer mais forte.

Essas imagens mostram amplitude ao longo do tempo. **Não são partituras, espectrogramas ou gráficos de frequência.** O volume final percebido também depende do ganho de reprodução, do dispositivo e da mixagem do jogo. A prévia enviada para aprovação usou ganho de apresentação adicional de aproximadamente +2 dB; os gráficos usam os masters individuais antes desse ganho.

---

## Mapa das notas

![Piano roll das notas das nove músicas, com baixo, acordes, melodia e percussão separados](notas-musicas.png)

Este é um **piano roll**, uma representação temporal dos eventos definidos no compositor, não uma partitura tradicional e não uma transcrição inferida do áudio.

- Cada barra marca a altura e a duração programadas de uma nota.
- Azul: baixo. Verde: acordes. Ocre: melodia/cordas.
- A faixa inferior “Perc.” registra ataques sem nota musical definida. Eles não receberam alturas inventadas.
- O eixo horizontal usa segundos; as pequenas diferenças de início seguem os mesmos números e sementes do compositor.
- As alturas são os valores MIDI-alvo do código. Não representam uma medição da afinação física do WAV.
- A duração das barras não inclui a cauda do ambiente nem toda a propagação de ressonância.

As notas que atravessam a borda do ciclo aparecem divididas entre o fim e o começo, assim como na renderização circular do áudio.

As sementes de execução são determinísticas, permitindo reproduzir os mesmos eventos. O manifesto [eventos-sonoros.json](eventos-sonoros.json) contém **1.696 eventos das nove músicas**, além dos eventos dos efeitos, com início, duração, tipo de som, nota quando aplicável, ganho e panorama.

---

## Efeitos instrumentais V2

| Efeito | Intenção sonora | Notas-alvo ou gesto |
|---|---|---|
| Selecionar | Toque de madeira | Percussivo, sem altura definida |
| Confirmar | Duas cordas | Dó4 → Sol4 |
| Voltar | Corda grave | Sol3 |
| Acerto | Dedilhado | Mi4 → Lá4 |
| Erro | Madeira abafada e grave | Madeira + Dó3 |
| Coleta | Nota curta | Dó5 |
| Recorde | Acorde aberto | Dó4, Mi4, Sol4, Si4 |
| Vitória | Pequena cadência | Sol3, Dó4, Mi4, Sol4 |
| Derrota | Descanso | Si3 → Sol3 |

O som de madeira combina ressonâncias breves e ruído amortecido. As cordas usam excitação por ruído filtrado, realimentação amortecida e pequenas ressonâncias de corpo. O ambiente é discreto. Não se trata de samples de madeira ou de um violão gravado.

![Formas de onda dos nove efeitos instrumentais V2](ondas-efeitos.png)

![Mapa das notas e dos ataques de madeira dos efeitos V2](notas-efeitos.png)

---

## Reprodutibilidade das visualizações

O script [gerar_visualizacoes.py](../../scripts/audio/gerar_visualizacoes.py) precisa de Python, NumPy, SciPy e Matplotlib. Recebe dois diretórios: um com `compor.py` e os nove WAV de música; outro com `efeitos_acusticos.py` e os nove `acustico_*.wav`.

```bash
python scripts/audio/gerar_visualizacoes.py \
  --musica /caminho/dos/masters-de-musica \
  --efeitos /caminho/dos/masters-de-efeitos \
  --saida /caminho/das/visualizacoes
```

Para documentar os eventos musicais, o script executa **somente as definições e o agendamento do compositor confiável**, substituindo a síntese por registros. Não executa a etapa de renderização/exportação. Os dados de efeitos são lidos como literais da AST Python. Não use um compositor desconhecido como entrada: a parte musical executa código Python.

O manifesto guarda hashes SHA-256 dos dois fontes e dos 18 WAV utilizados. Isso permite conferir de quais arquivos saíram as imagens. As figuras foram geradas e inspecionadas visualmente. Elas não comprovam, por si, ausência de falhas de reprodução no navegador ou qualidade de transição entre telas; esses aspectos precisam dos testes do sistema de áudio.

## Reprodução no jogo

[Player e limites](../../dist/audio/README.md) · [Recriar os arquivos](../../scripts/audio/README.md). As músicas de produção contêm o ganho de apresentação +2 dB e compressão FLAC sem perdas; efeitos mantêm WAV original. O controle de volume é independente do mute e viaja no backup versão 3, compatível com versões anteriores.
