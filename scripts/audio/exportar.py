"""Recria arquivos de produção sem depender de caminhos privados ou de prévias."""
from pathlib import Path
import os, subprocess, tempfile, shutil, hashlib, json
import numpy as np
from scipy.io.wavfile import read, write
ROOT=Path(__file__).resolve().parents[2]
SOURCE=Path(__file__).parent
NAMES=['inicio','galeria','nivel','jogo','pausa','roteiro','parada','resultado','resumo']
with tempfile.TemporaryDirectory(prefix='miudezas-audio-') as temporary:
    work=Path(temporary);env={**os.environ,'AUDIO_OUT':str(work)}
    for script in ['compor.py','efeitos_acusticos.py']:
        subprocess.run(['python3',str(SOURCE/script)],env=env,check=True)
    manifest={}
    for file,name in zip(sorted(work.glob('0*.wav')),NAMES):
        rate,samples=read(file)
        # Ganho exato da amostra de referência, antes do controle individual do jogador.
        samples=(samples.astype(float)*1.2589).clip(-32768,32767).astype(np.int16)
        temporary_wav=work/(name+'.wav');write(temporary_wav,rate,samples)
        target=ROOT/'dist/audio/musicas'/(name+'.flac')
        subprocess.run(['ffmpeg','-v','error','-y','-i',str(temporary_wav),'-c:a','flac',str(target)],check=True)
        manifest[name]={'origem':file.name,'segundos':len(samples)/rate,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
    for file in work.glob('acustico_*.wav'):
        shutil.copyfile(file,ROOT/'dist/audio/efeitos'/file.name.removeprefix('acustico_'))
    (ROOT/'dist/audio/manifesto.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
