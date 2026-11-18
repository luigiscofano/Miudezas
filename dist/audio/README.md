# Áudio de produção

Nove trilhas em FLAC sem perdas, estéreo 44,1 kHz, e nove efeitos V2 em WAV. Arquivos carregados somente depois de interação com som habilitado. A preferência antiga `som` continua válida; por padrão permanece desligada.

[Direção, formas de onda e mapas de notas](../../docs/audio/README.md) · [Reprodução por código](../../scripts/audio/README.md) · [Player](../audio.js).

Cada tela usa a faixa com o mesmo identificador. Crossfade de 300 ms, envelope de 4 ms nas extremidades dos ciclos, cache de até três músicas decodificadas, limite de dez fontes simultâneas e efeitos limitados a um início por 40 ms. Sem requisições ou trabalho sonoro por quadro. Trocas obsoletas são descartadas; aba oculta suspende áudio, retorno exige interação. Falhas de rede/decodificação não interrompem os jogos.

Música padrão 70%, efeitos 100%, ambos limitados por mute. Pisca/Rádio recebem música atenuada a um sétimo desse volume para preservar as pistas; frequências/durações originais desses jogos, do vento e do balde não são substituídas. Sons novos não são a única indicação de resultado. O manifesto registra duração e hash dos arquivos publicados.
