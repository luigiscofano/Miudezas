# Síntese reproduzível

## Bossa de Janela e Tarde na Tijuca

Bossa de Janela é o padrão em Configurações. Tarde na Tijuca conserva os nove temas anteriores e seus arquivos, sem alterar os efeitos. A escolha e os volumes persistem localmente e no backup; o botão de som continua independente. A primeira interação habilitada inicia a música, e a navegação não reinicia a faixa. Cada opção guarda sua posição durante a sessão.

A Bossa usa o loop exato V9: 16 compassos em 4/4, 82 BPM, 46,829274 s, estéreo PCM de 16 bits / 44,1 kHz transportado em FLAC sem perdas. Não recebeu o tratamento de borda aplicado aos temas antigos. Fole, violão e baixo são síntese original, não gravações de músicos. Os arquivos e efeitos anteriores permanecem byte a byte.

O fonte da Bossa está em [bossa-janela/compor.py](bossa-janela/compor.py); instruções de reprodução e hashes em [bossa-janela/README.md](bossa-janela/README.md). Os scripts anteriores abaixo continuam reproduzindo Tarde na Tijuca.


`compor.py` é a composição **Interpretação Mais Natural**: nove ciclos originais. `efeitos_8bit.py` gera os nove efeitos 8-bit opção B. `efeitos_acusticos.py` é um fonte legado e não produz os efeitos atuais. Comentários explicam o fraseado e a síntese. Nenhum sample externo ou credencial.

Requer Python 3, NumPy, SciPy e ffmpeg. Opcionalmente Matplotlib para figuras. Instale as dependências no seu ambiente Python isolado. Da raiz:

```sh
python3 scripts/audio/exportar.py
node --test tests/audio.test.mjs
```

O exportador usa diretório temporário, aplica o mesmo ganho +2 dB da prévia à música e grava FLAC sem perdas em `dist/audio/musicas`. Efeitos usam WAV 8-bit opção B; seu ganho é aplicado pelo player. Não publica automaticamente. Revise alterações binárias e manifesto no PR.

Para atualizar as figuras dos efeitos atuais, sem alterar as figuras musicais:

```sh
python3 scripts/audio/gerar_visualizacoes.py --somente-efeitos --saida docs/audio
```

Para recriar todas as imagens, gere masters de música com `AUDIO_OUT=/tmp/miudezas-masters python3 scripts/audio/compor.py`, copie `compor.py` para essa pasta e execute:

```sh
python3 scripts/audio/gerar_visualizacoes.py \
  --musica /tmp/miudezas-masters \
  --efeitos dist/audio/efeitos \
  --fonte-efeitos scripts/audio/efeitos_8bit.py \
  --saida docs/audio
```

O mapa de música é derivado dos eventos do compositor. Efeitos são representados pelas frequências-alvo em Hz e tempo, incluindo varreduras, sem conversão artificial em notas temperadas. As formas de onda leem os WAV. Nenhuma figura é uma transcrição estimada da onda. [Explicação dos gráficos](../../docs/audio/README.md).
