"""Bossa de janela — prévia original, sem samples. Python + NumPy + SciPy.
Execute neste diretório: python3 compor.py. Não lê nem altera o jogo.
"""
from pathlib import Path
import json
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io.wavfile import write

SR, BPM, SEED = 44100, 82, 20261119
BEAT = 60 / BPM
OUT = Path(__file__).parent
rng = np.random.default_rng(SEED)
mix = np.zeros((round(64 * BEAT * SR), 2))
events = []

def envelope(t, attack, release):
    return np.minimum(t / attack, 1) * np.minimum((t[-1] - t) / release, 1)

def smooth_envelope(t, attack, release):
    # Curvas sem quinas nos extremos, mantendo a duração e o espaço entre gestos.
    onset = np.sin(np.pi*.5*np.clip(t/attack,0,1))**2
    offset = np.sin(np.pi*.5*np.clip((t[-1]-t)/release,0,1))**2
    return onset*offset

def tone(pitch, duration, voice, touch=1, release_factor=1):
    t = np.arange(round(duration * SR)) / SR
    f = 440 * 2 ** ((pitch - 69) / 12)
    if voice == 'baixo':
        y = np.sin(2*np.pi*f*t) + .12*np.sin(4*np.pi*f*t)
        return y*np.exp(-t*2.4)*envelope(t,.012,.09)
    if voice == 'fole':
        # Palheta arredondada: parciais pares presentes, sem série de onda quadrada.
        phase = f*t
        pressure = .79 + .21*np.sin(np.pi*np.minimum(t/duration,1))
        y = np.sin(2*np.pi*phase)
        for h,level in [(2,.32),(3,.075),(4,.038),(5,.012)]:
            y += level*(.7+.3*pressure*touch)*np.sin(2*np.pi*h*phase+.09*h)
        # Ar filtrado determinístico, muito baixo, segue a respiração de cada nota.
        air_rng = np.random.default_rng(SEED+pitch+len(t))
        air = sosfilt(butter(2,[500,1700],btype='bandpass',fs=SR,output='sos'),air_rng.normal(0,1,len(t)))
        return (y+.012*air)*pressure*smooth_envelope(t,.030+.020/touch,.105*release_factor)
    # Cordas de nylon: ponto de pinçamento e amortecimento individual dos parciais.
    # Nenhuma camada quadrada no violão; o corpo ressoa apenas no ataque.
    y = np.zeros(len(t))
    for h in range(1,10):
        pluck_position = np.sin(np.pi*h*.23)/np.sin(np.pi*.23)
        decay = .70*np.exp(-t*(2.8+1.2*h)) + .30*np.exp(-t*(.8+.43*h))
        y += pluck_position*np.sin(2*np.pi*f*h*t+.035*h)*decay/h**(1.3+.22/touch)
    body = (.07*np.sin(2*np.pi*196*t)+.035*np.sin(2*np.pi*392*t))*np.exp(-t*32)
    return (y+body)*smooth_envelope(t,.010+.004/touch,.115*release_factor)

def add(y, at, gain, pan=0):
    # Depósito circular inclui a cauda final no começo, sem corte de reverberação.
    idx = (round(at*SR)+np.arange(len(y))) % len(mix)
    stereo = y[:,None]*gain*np.sqrt([(1-pan)/2,(1+pan)/2])
    np.add.at(mix,idx,stereo)

def animation(at):
    # Cresce até três quartos do ciclo e repousa no fim, sem degrau na repetição.
    u=(at/(64*BEAT))%1
    phase=u/.78 if u<=.78 else (1-u)/.22
    return np.sin(np.pi*.5*phase)**2

def note(bar, pos, pitch, beats, voice, gain, pan=0, gesture=0, ending=False):
    # Curvas de dois compassos: apoio, resposta e repouso, sem sorteio de intensidade.
    phrase = [1.03,.91,1.0,.87,1.04,.95,1.0,.86,1.04,.97,1.02,.93,1.0,.92,.97,.84][bar]
    timing = [0,.008,-.003,.011][bar%4]
    articulation = [1.0,.95,.87][min(gesture,2)] if voice != 'baixo' else 1
    at = (bar*4+pos)*BEAT + timing + (0 if voice=='baixo' else .004*gesture)
    duration = beats*BEAT
    if voice == 'fole':
        # Um pouco mais de sustentação, sem ocupar as pausas ou criar sobreposição.
        next_onsets = [start for start,_,_ in phrases[bar] if start>pos]
        following = min(next_onsets) if next_onsets else 4+phrases[(bar+1)%16][0][0]
        gap = max(0,(following-pos-beats)*BEAT)
        duration += min(.035,gap*.15)
    if voice == 'baixo':
        # O apoio do primeiro tempo e a resposta respiram dentro do mesmo pulso.
        gain *= 1.0 if pos==0 else .96
        at += .003 if pos==2 else 0
    # Liga só as lacunas diagnosticadas; não cria notas nem dobra a melodia.
    if voice=='fole' and bar==3 and gesture==2: duration += .16
    if voice=='fole' and bar==4 and gesture==0: duration += .11
    if voice=='baixo' and bar==4 and pos==0: duration += .20
    growth=animation(at)
    if voice=='corda': gain *= 1+.12*growth
    if voice=='baixo': gain *= 1+.075*growth
    touch = phrase*articulation
    gain *= touch
    add(tone(pitch,duration,voice,touch,1.12 if ending else 1),at,gain,pan)
    events.append(dict(bar=bar+1,beat=pos,pitch=pitch,seconds=at,duration=duration,voice=voice,gain=gain))

# Forma A/A'/B/A'', em Fá: voicings próximos e dominante suave de retorno.
chords = [('Fmaj9', 41, [57, 60, 64, 67]), ('D7(9)', 38, [54, 60, 64, 69]), ('Gm9', 43, [58, 62, 65, 69]), ('C13', 36, [58, 62, 64, 69]), ('F6/9', 41, [57, 62, 67, 69]), ('Am7', 45, [55, 60, 64, 67]), ('Gm9', 43, [57, 58, 62, 65]), ('C7(9)', 36, [58, 62, 64, 67]), ('Fmaj9', 41, [57, 60, 64, 67]), ('D7(9)', 38, [54, 60, 64, 69]), ('Gm9', 43, [58, 62, 65, 69]), ('C13', 36, [58, 62, 64, 69]), ('F6/9', 41, [57, 62, 67, 69]), ('Am7', 45, [55, 60, 64, 67]), ('Gm9', 43, [57, 58, 62, 65]), ('C7(9)', 36, [58, 62, 64, 67])]
# Frase escrita para esta prévia; pausas e antecipações fazem parte da melodia.
phrases = [[(0.5, 69, 0.65), (1.5, 72, 0.45), (2.25, 67, 1.15)], [(0.25, 66, 0.5), (1, 64, 0.7), (2.5, 69, 0.65)], [(0.5, 70, 0.8), (1.75, 69, 0.45), (2.5, 65, 0.85)], [(0.75, 64, 0.65), (2, 62, 0.5), (3.25, 67, 0.45)], [(0.25, 69, 0.6), (1.25, 72, 0.55), (2.5, 74, 0.7)], [(0.5, 72, 0.8), (2, 71, 0.45), (2.75, 67, 0.7)], [(0.75, 69, 0.6), (1.75, 65, 0.75)], [(0.5, 64, 0.5), (1.5, 62, 0.6), (3, 60, 0.5)], [(0.5, 69, 0.65), (1.5, 72, 0.45), (2.25, 67, 1.15)], [(0.25, 66, 0.5), (1, 64, 0.7), (2.5, 69, 0.85)], [(0.5, 70, 0.8), (1.75, 69, 0.45), (2.5, 67, 0.9)], [(0.5, 67, 0.65), (1.5, 70, 0.45), (2.25, 64, 1.15)], [(0.25, 69, 0.6), (1.25, 72, 0.55), (2.5, 74, 0.85)], [(0.5, 72, 0.8), (2, 71, 0.45), (2.75, 69, 0.85)], [(0.5, 70, 0.8), (1.75, 69, 0.45), (2.5, 65, 1.05)], [(0.75, 64, 0.8), (2, 62, 0.65), (3, 67, 0.65)]]

for bar, (name, root, chord) in enumerate(chords):
    for pos,pitch,vel in [(0,root,1),(2,root+7,.78)]:
        note(bar,pos,pitch,.8,'baixo',.085*vel)
    rhythm = [(0,.66),(1.5,1),(2.5,.65),(3.5,.8)] if bar%2==0 else [(.5,.85),(1.5,.65),(2.75,.85)]
    def occupied(pos):
        return any(start-.08 <= pos < start+duration+.10 for start,_,duration in phrases[bar])
    for pos,vel in rhythm:
        busy = occupied(pos)
        # Sob a frase, só apoios fortes de duas notas; respostas maiores nos espaços.
        if busy and vel < .8:
            continue
        selected = [chord[0],chord[2]] if busy else [chord[0],chord[1],chord[3]]
        next_phrase = min([start-pos for start,_,_ in phrases[bar] if start>pos] or [1.0])
        length = .30 if busy else min(.52,max(.18,next_phrase-.06))
        for j,pitch in enumerate(selected):
            spread = [0,.018,.041]
            note(bar,pos+spread[j]/BEAT,pitch,length,'corda',.022*vel*[1,.87,.75][j],-.26+j*.10)
    for gesture,(pos,pitch,dur) in enumerate(phrases[bar]):
        # A mesma linha inteira passa ao fole; cordas respondem apenas no acompanhamento.
        note(bar,pos,pitch,dur,'fole',.082,.08,gesture,gesture==len(phrases[bar])-1)
    # Ganzá e aro ficam abaixo da melodia; sem prato brilhante ou bumbo pesado.
    for tick in range(8):
        if occupied(tick*.5):
            continue
        t=np.arange(round(.075*SR))/SR
        noise=sosfilt(butter(2,[1800,5200],btype='bandpass',fs=SR,output='sos'),rng.normal(0,1,len(t)))
        add(noise*np.exp(-t*60)*envelope(t,.002,.012),(bar*4+tick*.5)*BEAT,(.004 if tick%2 else .0025)*(1+.22*animation((bar*4+tick*.5)*BEAT)),-.3)
    for pos in ([1,3] if bar%2==0 else [1,2.75]):
        if occupied(pos):
            continue
        t=np.arange(round(.07*SR))/SR
        add((np.sin(2*np.pi*710*t)+.3*np.sin(2*np.pi*1230*t))*np.exp(-t*95)*envelope(t,.002,.01),(bar*4+pos)*BEAT,.005*(1+.15*animation((bar*4+pos)*BEAT)),.25)

# Ambiente curto circular, sem eco destacado; não se usa fade que interrompa o loop.
dry=mix.copy()
for delay,gain in [(.029,.035),(.047,.020)]:
    mix += np.roll(dry,round(delay*SR),axis=0)[:,::-1]*gain
# Ganho fixo da V5, sem normalização global que modifique a primeira metade.
mix -= np.array([-8.669053113679006e-07,-8.134353264218173e-07])
mix *= 2.611326219922341
# Compensa apenas 0,1 dB para comparação com a V8, sem compressão.
mix *= 10**(-.1/20)
pcm=np.round(mix*32767).astype('<i2')
write(OUT/'Bossa-de-janela-V9-loop.wav',SR,pcm)
stats=dict(title='Bossa de janela',bpm=BPM,seed=SEED,bars=16,duration=len(mix)/SR,peak_dbfs=float(20*np.log10(np.max(abs(mix)))),rms_dbfs=float(20*np.log10(np.sqrt(np.mean(mix**2)))),boundary_step=float(np.max(abs(mix[0]-mix[-1]))),max_step=float(np.max(abs(np.diff(mix,axis=0)))),clipped_samples=int(np.sum(abs(mix)>=1)),chords=[x[0] for x in chords])
(OUT/'eventos.json').write_text(json.dumps(dict(stats=stats,events=events),ensure_ascii=False,indent=2))
print(json.dumps(stats,indent=2))
