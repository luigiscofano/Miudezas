"""Documenta amostras reais e eventos do compositor, sem reconstrução auditiva."""
from pathlib import Path
import argparse, ast, hashlib, json
import numpy as np
from scipy.io.wavfile import read
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle,Patch

parser=argparse.ArgumentParser()
parser.add_argument('--musica',type=Path,default=Path('../miudezas-trilha-natural'))
parser.add_argument('--efeitos',type=Path,default=Path('../miudezas-trilha-relaxante'))
parser.add_argument('--saida',type=Path,default=Path('.'))
args=parser.parse_args(); OUT=args.saida;OUT.mkdir(exist_ok=True,parents=True)
source=(args.musica/'compor.py').read_text()
# Executa somente definições e o agendamento original, com instrumentos substituídos
# por registros. Assim, as microvariações de tempo usam a mesma semente do áudio.
namespace={'__file__':str(args.musica/'compor.py')}
exec(source[:source.index('tracks=[]; stats=[]')],namespace)
events=[]
def note(n,dur,kind='pluck'):return {'tipo':kind,'nota_midi':int(n),'duracao_s':float(int(dur*44100)/44100)}
def drum(kind):return {'tipo':kind,'nota_midi':None,'duracao_s':{'kick':.18,'rim':.055,'hat':.055,'shaker':.09}[kind]}
def add(buf,event,at,gain=.1,pan=0,wrap=True):
    events.append({**event,'inicio_s':float((round(at*44100)%round(capture_length*44100))/44100),'ganho_evento':float(gain),'pan':float(pan)})
namespace.update(note=note,drum=drum,add=add)
# Mantém o loop de cada compasso literalmente, sem os passos de síntese/exportação.
loop=source[source.index('    for bar,(root,chord)'):source.index('    # Reverb curto')]
import textwrap
loop=textwrap.dedent(loop)
tracks=[]
for index,theme in enumerate(namespace['THEMES']):
    name,bpm,screen,motif,density=theme;events=[];capture_length=32*60/bpm
    namespace.update(index=index,name=name,bpm=bpm,screen=screen,motif=motif,density=density,beat=60/bpm,buf=np.empty((1,2)))
    exec(loop,namespace)
    tracks.append({'arquivo':name,'tela':screen,'bpm':bpm,'duracao_s':32*60/bpm,'eventos':events})
fxsource=(args.efeitos/'efeitos_acusticos.py').read_text()
fx=next(ast.literal_eval(node.value) for node in ast.parse(fxsource).body if isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='FX' for t in node.targets))
effects=[]
for title,items in fx:
    name='acustico_'+title.split(' — ')[0].lower()
    effects.append({'arquivo':name,'nome':title,'eventos':[{'inicio_s':t,'nota_midi':n,'ganho_evento':g,'tipo':'madeira' if n is None else 'corda','duracao_s':.12 if n is None else .6} for t,n,g in items]})
manifest={'origem':'Interpretação Mais Natural e efeitos instrumentais V2','nota':'Eventos extraídos do código; não transcrição do WAV. Durações dos eventos não incluem reverberação. Notas são alvos MIDI da síntese, não medição da afinação.','compositor_sha256':hashlib.sha256(source.encode()).hexdigest(),'efeitos_sha256':hashlib.sha256(fxsource.encode()).hexdigest(),'musicas':tracks,'efeitos':effects,'wav_sha256':{}}
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':9,'axes.spines.top':False,'axes.spines.right':False,'axes.titlesize':11})
colors={'bass':'#2b5475','chord':'#438b73','pad':'#438b73','pluck':'#ad6b25','corda':'#ad6b25'}
def waveform(items,folder,filename,title):
    fig,axes=plt.subplots(3,3,figsize=(15,9),constrained_layout=True)
    for ax,item in zip(axes.flat,items):
        f=folder/(item['arquivo']+'.wav');sr,y=read(f);manifest['wav_sha256'][f.name]=hashlib.sha256(f.read_bytes()).hexdigest()
        y=y.astype(float)/32768
        # Envelope mínimo/máximo do canal esquerdo: preserva os picos de cada bloco.
        left=y[:,0] if y.ndim==2 else y;step=max(1,len(left)//1200);count=len(left)//step
        chunks=left[:count*step].reshape(count,step);x=np.arange(count)*step/sr
        ax.fill_between(x,chunks.min(1),chunks.max(1),color='#35695b',alpha=.85,linewidth=.3)
        ax.set_ylim(-1,1);ax.set_xlim(0,len(left)/sr);ax.set_title(item.get('tela',item.get('nome')).replace(' — ','\n'),loc='left')
        ax.set_xlabel('Tempo (s)');ax.set_ylabel('Amplitude PCM');ax.grid(alpha=.15)
    fig.suptitle(title+'\nCanal esquerdo • escala comum −1 a +1 • sem normalização individual',fontsize=15)
    fig.savefig(OUT/filename,dpi=140);plt.close(fig)
def midi_label(n):return ['Dó','Dó♯','Ré','Ré♯','Mi','Fá','Fá♯','Sol','Sol♯','Lá','Lá♯','Si'][n%12]+str(n//12-1)
def score(items,filename,title):
    fig,axes=plt.subplots(3,3,figsize=(15,12),constrained_layout=True)
    for ax,item in zip(axes.flat,items):
        musical=[e for e in item['eventos'] if e['nota_midi'] is not None];percussion=[e for e in item['eventos'] if e['nota_midi'] is None]
        for e in musical:
            limit=item.get('duracao_s',1.35);dur=min(e['duracao_s'],limit-e['inicio_s'])
            ax.add_patch(Rectangle((e['inicio_s'],e['nota_midi']-.35),dur,.7,color=colors[e['tipo']],alpha=.8,linewidth=0))
            if e['inicio_s']+e['duracao_s']>limit:
                ax.add_patch(Rectangle((0,e['nota_midi']-.35),e['inicio_s']+e['duracao_s']-limit,.7,color=colors[e['tipo']],alpha=.8,linewidth=0))
        # Percussão sem nota definida aparece numa faixa separada, nunca como altura musical.
        for e in percussion:ax.add_patch(Rectangle((e['inicio_s'],38.65),e['duracao_s'],.7,color='#666',alpha=.9,linewidth=0))
        ax.set_ylim(37,80);ticks=[39,48,60,72,79];ax.set_yticks(ticks,['Perc.',midi_label(48),midi_label(60),midi_label(72),midi_label(79)])
        ax.set_xlim(0,item.get('duracao_s',1.35));ax.set_xlabel('Tempo (s)');ax.grid(alpha=.16)
        ax.set_title(item.get('tela',item.get('nome')).replace(' — ','\n')+(f" • {item['bpm']} BPM" if 'bpm' in item else ''),loc='left')
    fig.suptitle(title+'\nPiano roll dos eventos do código • barras = duração programada, não duração do eco',fontsize=14)
    fig.legend(handles=[Patch(color=colors[k],label=v) for k,v in [('bass','Baixo'),('chord','Acordes'),('pluck','Melodia / cordas')]]+[Patch(color='#666',label='Percussão sem altura definida')],loc='outside lower center',ncol=4)
    fig.savefig(OUT/filename,dpi=140);plt.close(fig)
waveform(tracks,args.musica,'ondas-musicas.png','Nove músicas — formas de onda dos WAV')
waveform(effects,args.efeitos,'ondas-efeitos.png','Nove efeitos V2 — formas de onda dos WAV')
score(tracks,'notas-musicas.png','Nove músicas — mapa de notas e articulação')
score(effects,'notas-efeitos.png','Nove efeitos V2 — notas e toques de madeira')
(OUT/'eventos-sonoros.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print('Criadas quatro imagens e manifesto com',sum(len(t['eventos']) for t in tracks),'eventos musicais.')
