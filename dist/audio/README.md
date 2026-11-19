# Áudio de produção

## Bossa de Janela e Tarde na Tijuca

Bossa de Janela é o padrão em Configurações. Tarde na Tijuca conserva os nove temas anteriores e seus arquivos, sem alterar os efeitos. A escolha e os volumes persistem localmente e no backup; o botão de som continua independente. A primeira interação habilitada inicia a música, e a navegação não reinicia a faixa. Cada opção guarda sua posição durante a sessão.

A Bossa usa o loop exato V9: 16 compassos em 4/4, 82 BPM, 46,829274 s, estéreo PCM de 16 bits / 44,1 kHz transportado em FLAC sem perdas. Não recebeu o tratamento de borda aplicado aos temas antigos. Fole, violão e baixo são síntese original, não gravações de músicos. Os arquivos e efeitos anteriores permanecem byte a byte.


Bossa de Janela e nove temas de Tarde na Tijuca em FLAC sem perdas, estéreo 44,1 kHz, e nove efeitos 8-bit opção B em WAV. Arquivos carregados somente depois de interação com som habilitado. A preferência antiga `som` continua válida; por padrão permanece desligada.

[Direção, formas de onda e mapas de notas](../../docs/audio/README.md) · [Reprodução por código](../../scripts/audio/README.md) · [Player](../audio.js).

Em Tarde na Tijuca, a primeira tela em que o som é ativado escolhe o tema da sessão. A mesma faixa continua em loop ao navegar pelo catálogo, níveis, partida, pausa, configurações e resultados, sem reiniciar nem trocar a música. Apenas o volume é atenuado nas pistas de Pisca/Rádio. Mute e aba oculta guardam a posição em memória; ao reativar, o áudio retoma desse ponto com entrada suave de 300 ms. Recarregar a página inicia uma nova sessão. O envelope de 4 ms nas extremidades suaviza somente os loops antigos; Bossa de Janela conserva o PCM do compositor. Há limite de dez fontes simultâneas e efeitos limitados a um início por 40 ms. Retornar à aba exige interação; falhas de rede/decodificação não interrompem os jogos.

Música padrão 10%, efeitos 5%, ambos limitados por mute. Pisca/Rádio recebem música atenuada a um sétimo desse volume para preservar as pistas; frequências/durações originais desses jogos, do vento e do balde não são substituídas. Sons novos não são a única indicação de resultado. O manifesto legado registra duração e hash dos nove temas anteriores; os hashes da Bossa estão no README de seu fonte.

Os padrões de 10% para música e 5% para efeitos valem quando não há valor salvo e ao escolher restaurar volumes. Ajustes existentes, inclusive zero, e a preferência de silêncio não são sobrescritos.

Entre contextos da mesma origem, BroadcastChannel solicita a cessão do áudio e Web Locks serializa a reprodução quando disponível. Sem Web Locks, o canal continua silenciando o player anterior; não há garantia de exclusão atômica em navegadores sem essa API. A página que abriu uma janela externa continua sem poder retomar som até fechá-la. Uma falha ao adquirir a trava conserva o jogo em silêncio.
