"""Efeitos de interface 8-bit discretos, sem cordas ou acordes."""
from pathlib import Path
import numpy as np
from scipy.io.wavfile import read,write
from scipy.signal import butter,sosfilt
import os
P=Path(os.environ.get('AUDIO_OUT',Path(__file__).parent));P.mkdir(parents=True,exist_ok=True);SR=44100
rng=np.random.default_rng(731)
def pulso(f0,f1,dur):
 t=np.arange(round(dur*SR))/SR
 f=np.linspace(f0,f1,len(t));fase=np.cumsum(f)/SR
 # Onda de pulso suave, com resolução temporal de chip e envelope sem estalos.
 fase=np.floor(fase*32)/32
 y=.72*np.sin(2*np.pi*fase)+.14*np.sin(6*np.pi*fase)+.04*np.sin(10*np.pi*fase)
 y*=np.minimum(1,t/.006)*np.minimum(1,(dur-t)/.025)*np.exp(-t*5)
 return sosfilt(butter(2,1900,fs=SR,output='sos'),y)
def clique(dur=.055):
 t=np.arange(round(dur*SR))/SR
 y=rng.choice([-1.,1.],len(t))*np.exp(-t*80)
 y=sosfilt(butter(2,[350,1450],btype='bandpass',fs=SR,output='sos'),y)
 return y*np.minimum(1,t/.004)*np.minimum(1,(dur-t)/.015)
# Contornos curtos reconhecíveis em jogos, sem arpejos ou instrumentação de corda.
eventos={
 'selecionar':[(0,420,420,.045)],
 'confirmar':[(0,560,560,.055),(.075,840,840,.075)],
 'voltar':[(0,420,420,.055),(.075,310,310,.065)],
 'acerto':[(0,740,740,.065),(.09,990,990,.095)],
 'erro':[(0,210,210,.065),(.09,210,170,.09)],
 'coleta':[(0,1120,1500,.055)],
 'recorde':[(0,660,660,.06),(.085,990,990,.065),(.17,1320,1320,.10)],
 'vitoria':[(0,600,600,.08),(.105,800,800,.085),(.22,1000,1000,.13)],
 'derrota':[(0,380,380,.085),(.115,270,270,.09),(.24,190,170,.12)]}

# Limites de pico e energia mantêm todos os sinais discretos, sem normalização excessiva.
LIMITES={'selecionar': (0.03903961181640625, 0.5423549152910709), 'confirmar': (0.07115325927734374, 5.289227986708283), 'voltar': (0.08630218505859374, 7.018708946183324), 'acerto': (0.061114501953125, 4.154137340374291), 'erro': (0.0505828857421875, 2.2387939356267452), 'coleta': (0.0461212158203125, 1.5476758927106857), 'recorde': (0.062774658203125, 5.342006598599255), 'vitoria': (0.06350097656249999, 7.577369921840727), 'derrota': (0.04002532958984375, 3.2651545433327556)}
for nome,notas in eventos.items():
 y=np.zeros(round(.85*SR))
 for onset,f0,f1,dur in notas:
  v=clique(dur) if f0 is None else pulso(f0,f1,dur)
  i=round(onset*SR);y[i:i+len(v)]+=v
 pico,energia=LIMITES[nome]
 y*=min(pico/max(abs(y)),np.sqrt(energia/max(1e-15,np.sum(y*y))))
 write(P/(nome+'.wav'),SR,np.int16(np.column_stack([y,y])*32767))
