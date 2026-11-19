"""Gráficos derivados do FLAC publicado e dos eventos do compositor; não transcrição."""
from pathlib import Path
import json, subprocess
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from scipy.signal import spectrogram

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'docs/audio'
events=json.loads((OUT/'bossa-janela-eventos.json').read_text())
sr=44100
raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(ROOT/'dist/audio/musicas/bossa-janela.flac'),'-f','s16le','-'])
x=np.frombuffer(raw,dtype='<i2').reshape(-1,2)/32768
t=np.arange(len(x))/sr
plt.rcParams.update({'figure.facecolor':'#faf5e9','axes.facecolor':'#faf5e9','font.size':11,'axes.spines.top':False,'axes.spines.right':False})
def save(fig,name):
    fig.tight_layout();fig.savefig(OUT/name,dpi=150);plt.close(fig)
fig,axs=plt.subplots(2,1,figsize=(12,4),sharex=True)
for c,ax in enumerate(axs):
    # Envelope por blocos conserva picos, sem desenhar milhões de segmentos.
    block=441;v=x[:len(x)//block*block,c].reshape(-1,block);times=np.arange(len(v))*block/sr
    ax.fill_between(times,v.min(1),v.max(1),color=['#6a7752','#b56842'][c]);ax.set_ylabel(['Esquerdo','Direito'][c]);ax.set_ylim(-.32,.32)
axs[0].set_title('Bossa de Janela · forma de onda do loop V9 · PCM 44,1 kHz / 16 bits')
axs[-1].set_xlabel('Tempo (s)');save(fig,'bossa-janela-onda.png')
f,tt,p=spectrogram(x.mean(1),sr,nperseg=2048,noverlap=1536)
fig,ax=plt.subplots(figsize=(12,4));im=ax.pcolormesh(tt,f,10*np.log10(p+1e-16),vmin=-110,vmax=-40,cmap='magma',shading='auto');ax.set_ylim(40,8000);ax.set_yscale('log');ax.set_xlabel('Tempo (s)');ax.set_ylabel('Frequência (Hz)');ax.set_title('Bossa de Janela · espectrograma da média estéreo · não é mapa de notas');fig.colorbar(im,ax=ax,label='Densidade (dB/Hz)');save(fig,'bossa-janela-espectrograma.png')
fig,ax=plt.subplots(figsize=(12,4.8));colors={'fole':'#ae583b','corda':'#65754c','baixo':'#4d7188'}
for voice,color in colors.items():
    notes=[e for e in events['events'] if e['voice']==voice]
    for e in notes:ax.plot([e['seconds'],e['seconds']+e['duration']],[e['pitch']]*2,color=color,linewidth=2)
    ax.plot([],[],color=color,label=voice.capitalize())
ax.set_xlabel('Tempo (s)');ax.set_ylabel('Altura MIDI');ax.set_title('Bossa de Janela · eventos tonais do compositor (caudas/ambiente e percussão não desenhados)');ax.legend(loc='lower right');save(fig,'bossa-janela-notas.png')
fig,ax=plt.subplots(figsize=(12,3));bar=240/82
chords=events['stats']['chords']
for i in range(16):
    ax.broken_barh([(i*bar,bar)],(0,1),facecolors=('#718361' if i<8 else '#bd7957'),edgecolors='#faf5e9')
    ax.text((i+.5)*bar,.5,chords[i%len(chords)].replace('maj','M'),ha='center',va='center',fontsize=9,rotation=35)
ax.text(4*bar,1.2,'Tema inicial · 8 compassos',ha='center');ax.text(12*bar,1.2,'Sequência do motivo · 8 compassos',ha='center');ax.annotate('Retorno circular ao primeiro compasso',xy=(0,-.2),xytext=(46.8,-.2),arrowprops={'arrowstyle':'->'},ha='right',va='center');ax.set_ylim(-.5,1.6);ax.set_xlim(0,len(x)/sr);ax.set_yticks([]);ax.set_xlabel('Tempo (s)');ax.set_title('Bossa de Janela · 16 compassos · 4/4 · 82 BPM · 46,829 s');save(fig,'bossa-janela-loop.png')
