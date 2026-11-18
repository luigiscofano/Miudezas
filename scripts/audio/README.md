# Síntese reproduzível

`compor.py` é a composição aprovada **Interpretação Mais Natural**: nove ciclos originais. `efeitos_acusticos.py` gera os nove efeitos V2 aprovados. Comentários explicam o fraseado e a síntese. Nenhum sample externo ou credencial.

Requer Python 3, NumPy, SciPy e ffmpeg. Opcionalmente Matplotlib para figuras. Instale as dependências no seu ambiente Python isolado. Da raiz:

```sh
python3 scripts/audio/exportar.py
node --test tests/audio.test.mjs
```

O exportador usa diretório temporário, aplica o mesmo ganho +2 dB da prévia à música e grava FLAC sem perdas em `dist/audio/musicas`. Efeitos permanecem WAV V2; seu ganho é aplicado pelo player. Não publica automaticamente. Revise alterações binárias e manifesto no PR.

Para as imagens, gere masters em uma pasta temporária via `AUDIO_OUT=/tmp/miudezas-masters python3 scripts/audio/compor.py`, faça o mesmo com `efeitos_acusticos.py`, copie os dois scripts para essa pasta e execute `gerar_visualizacoes.py --musica /tmp/miudezas-masters --efeitos /tmp/miudezas-masters --saida docs/audio`. O mapa é derivado dos eventos do compositor, não de transcrição estimada da onda. [Explicação dos gráficos](../../docs/audio/README.md).
