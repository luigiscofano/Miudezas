# Bossa de Janela

Fonte original da V9 preservado, independente do compositor de Tarde na Tijuca. Requer Python, NumPy e SciPy; a reprodução foi conferida com NumPy 2.3.5 e SciPy 1.17.0. Sem downloads de samples. O script escreve WAV e eventos ao lado de si; não modifica o player.

```sh
python3 scripts/audio/bossa-janela/compor.py
ffmpeg -i scripts/audio/bossa-janela/Bossa-de-janela-V9-loop.wav -c:a flac -compression_level 12 dist/audio/musicas/bossa-janela.flac
python3 scripts/audio/bossa-janela/visualizar.py
```

O segundo comando deve ser usado somente para reconstruir o arquivo, sem filtros ou ganho. O terceiro requer Matplotlib e lê o FLAC e `docs/audio/bossa-janela-eventos.json`. Se modificar a composição no futuro, sincronize o JSON explicitamente; os gráficos atuais correspondem à V9.

- WAV SHA-256: `d43a5e28ecc4ad2e20e6337708b70bc2afa75fa6ea1da105f13dfcfe53e2540f`.
- PCM intercalado s16le SHA-256: `df36cab32da1546e736537db6ccec8d4b489ea8283c10252c3d87be79d93d92f`.
- 2.065.171 quadros estéreo, 44.100 Hz; 46,829274 s; 82 BPM, 16 compassos.
- Pico aproximado −10,86 dBFS; zero amostras saturadas. Sem normalização adicional.

A validação de PCM compara a saída `ffmpeg -i ...flac -f s16le -` aos frames do WAV com `wave` em Python. A emenda é circular no compositor, incluindo ambiente curto; o player usa `AudioBufferSourceNode.loop` sem aparar nem aplicar fade nas bordas deste arquivo. O fade de entrada do player continua em 300 ms.

O mapa de notas representa eventos de síntese de fole, corda e baixo, não uma transcrição automática. Percussão e ambiente ficam fora dele. Os timbres são síntese, não instrumentos gravados.
