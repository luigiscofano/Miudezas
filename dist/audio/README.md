# Áudio de produção

Nove trilhas em FLAC sem perdas, estéreo 44,1 kHz, e nove efeitos 8-bit opção B em WAV. Arquivos carregados somente depois de interação com som habilitado. A preferência antiga `som` continua válida; por padrão permanece desligada.

[Direção, formas de onda e mapas de notas](../../docs/audio/README.md) · [Reprodução por código](../../scripts/audio/README.md) · [Player](../audio.js).

A primeira tela em que o som é ativado escolhe o tema da sessão. A mesma faixa continua em loop ao navegar pelo catálogo, níveis, partida, pausa, configurações e resultados, sem reiniciar nem trocar a música. Apenas o volume é atenuado nas pistas de Pisca/Rádio. Mute e aba oculta guardam a posição em memória; ao reativar, o áudio retoma desse ponto com entrada suave de 300 ms. Recarregar a página inicia uma nova sessão. O envelope de 4 ms nas extremidades suaviza os loops. Há limite de dez fontes simultâneas e efeitos limitados a um início por 40 ms. Retornar à aba exige interação; falhas de rede/decodificação não interrompem os jogos.

Música padrão 10%, efeitos 5%, ambos limitados por mute. Pisca/Rádio recebem música atenuada a um sétimo desse volume para preservar as pistas; frequências/durações originais desses jogos, do vento e do balde não são substituídas. Sons novos não são a única indicação de resultado. O manifesto registra duração e hash dos arquivos publicados.

Os padrões de 10% para música e 5% para efeitos valem quando não há valor salvo e ao escolher restaurar volumes. Ajustes existentes, inclusive zero, e a preferência de silêncio não são sobrescritos.
