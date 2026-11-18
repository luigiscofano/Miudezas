"""Prévia de cordas dedilhadas e madeira por síntese física, sem gravações externas."""
from pathlib import Path
import numpy as np
from scipy.signal import lfilter, butter, sosfilt
from scipy.io.wavfile import write,read
import subprocess,json,os
SR=44100; P=Path(os.environ.get("AUDIO_OUT",Path(__file__).parent)); rng=np.random.default_rng(734)
def corda(n,dur=.6):
    freq=440*2**((n-69)/12); delay=int(SR/freq-.5)
    excitation=np.zeros(int(dur*SR)); seed=rng.uniform(-1,1,delay)
    seed=np.convolve(seed,[.22,.56,.22],mode='same'); excitation[:delay]=seed
    # A média entre duas amostras modela a perda de agudos de uma corda real.
    denominator=np.zeros(delay+2); denominator[0]=1; denominator[delay]=-.492; denominator[delay+1]=-.492
    y=lfilter([1],denominator,excitation)
    t=np.arange(len(y))/SR
    body=(np.sin(2*np.pi*190*t)*.04+np.sin(2*np.pi*310*t)*.025)*np.exp(-t*30)
    y=sosfilt(butter(2,3800,fs=SR,output='sos'),y+body)
    attack=np.minimum(1,t/.002); release=np.minimum(1,(dur-t)/.07)
    return y*attack*release*.7

def madeira(dur=.12):
    t=np.arange(round(dur*SR))/SR
    y=sum(np.sin(2*np.pi*f*t)*a*np.exp(-t*d) for f,a,d in [(680,.35,70),(1110,.22,95),(1750,.08,115)])
    y+=rng.normal(0,.035,len(t))*np.exp(-t*170)
    return y*np.minimum(1,t/.001)*np.minimum(1,(dur-t)/.025)

def mix(events,length=1.35):
    y=np.zeros(round(length*SR))
    for t,n,g in events:
        v=madeira() if n is None else corda(n)
        i=round(t*SR); v=v[:len(y)-i];y[i:i+len(v)]+=v*g
    # Pequena sala em vez de eco eletrônico perceptível.
    y+=np.roll(y,round(.037*SR))*.055
    return np.column_stack([y,y*.98])
FX=[('Selecionar — toque de madeira',[(0,None,.8)]),('Confirmar — duas cordas',[(0,60,.9),(.14,67,.75)]),('Voltar — corda grave',[(0,55,.85)]),('Acerto — dedilhado',[(0,64,.8),(.12,69,.7)]),('Erro — madeira abafada',[(0,None,.45),(.09,48,.45)]),('Coleta — nota curta',[(0,72,.75)]),('Recorde — acorde aberto',[(0,60,.6),(.08,64,.6),(.16,67,.6),(.25,71,.55)]),('Vitoria — pequena cadência',[(0,55,.6),(.15,60,.7),(.28,64,.7),(.42,67,.65)]),('Derrota — descanso',[(0,59,.6),(.22,55,.6)])]
clips=[]
for name,events in FX:
    x=mix(events); clips.extend([x,np.zeros((round(.5*SR),2))]);write(P/('acustico_'+name.split(' — ')[0].lower()+'.wav'),SR,(x*32767).astype('int16'))
fx=np.concatenate(clips);write(P/'Efeitos_Instrumentais_v2.wav',SR,(fx*32767).astype('int16'))
