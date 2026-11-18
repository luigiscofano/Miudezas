"""Composição original de prévia: chiptune suave com síncopes brasileiras.
Nenhum sample ou melodia de terceiros. Não altera o jogo.
"""
from pathlib import Path
import json, subprocess, os
import numpy as np
from scipy.signal import butter, sosfilt, lfilter
from scipy.io.wavfile import write
SR=44100
OUT=Path(os.environ.get("AUDIO_OUT",Path(__file__).parent)); OUT.mkdir(parents=True,exist_ok=True)
rng=np.random.default_rng(20261118)
expression_rng=np.random.default_rng(144)
brazil_rng=np.random.default_rng(199)
performance_rng=np.random.default_rng(812)
def hz(n): return 440*2**((n-69)/12)
def envelope(n,attack=.008,release=.06):
    e=np.ones(n); a=min(n//2,int(attack*SR)); r=min(n//2,int(release*SR))
    e[:a]=np.linspace(0,1,a); e[-r:]=np.linspace(1,0,r)
    return e

def note(n,dur,kind='pluck'):
    t=np.arange(int(dur*SR))/SR; f=hz(n); phase=f*t
    if kind=='bass':
        wave=.85*np.sin(2*np.pi*phase)+.13*np.sin(4*np.pi*phase)
        e=(.45+.55*np.exp(-t*9))*envelope(len(t),.006,.07)
    elif kind=='pad':
        wave=sum(np.sin(2*np.pi*phase*h)/h**2 for h in [1,3,5]); e=envelope(len(t),.045,.14)*.75
    else:
        # Pulso com harmônicos limitados: conserva o caráter de videogame sem agudos ásperos.
        wave=sum(np.sin(2*np.pi*phase*h)/h for h in [1,3,5])*.38
        wave=.30*wave+.70*np.sin(2*np.pi*phase)
        e=np.exp(-t*(5.5 if kind=='chord' else 2.7))*envelope(len(t),.018,.12)
    original=wave*e
    if kind in ('pluck','chord'):
        # Camada muito discreta de corda; não altera notas, duração ou início.
        delay=max(2,round(SR/f-.5)); excitation=np.zeros(len(t))
        seed=expression_rng.uniform(-1,1,delay); seed-=seed.mean()
        excitation[:delay]=np.convolve(seed,[.2,.6,.2],mode='same')
        denominator=np.zeros(delay+2);denominator[0]=1
        denominator[delay]=-.491;denominator[delay+1]=-.491
        string=lfilter([1],denominator,excitation)
        string=sosfilt(butter(2,2900,fs=SR,output='sos'),string)*envelope(len(t),.01,.12)
        rms=np.sqrt(np.mean(string**2))
        if rms>0: string*=np.sqrt(np.mean(original**2))/rms
        # A V2 continua predominante; expressão apenas na intensidade e textura.
        return (.72*original+.28*string)*expression_rng.uniform(.94,1.04)
    return original

def drum(kind):
    dur={'kick':.18,'rim':.055,'hat':.055,'shaker':.09}[kind]
    t=np.arange(int(dur*SR))/SR
    if kind=='kick':
        f=46+35*np.exp(-t*32); y=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*24)
    elif kind=='rim': y=(np.sin(2*np.pi*1000*t)+.4*np.sin(2*np.pi*1420*t))*np.exp(-t*95)*.35
    else:
        noise=rng.normal(0,.5,len(t)); y=sosfilt(butter(2,2500,'high',fs=SR,output='sos'),noise)*np.exp(-t*(65 if kind=='hat' else 38))
    if kind=='shaker':
        # Sementes e platinelas discretas: caráter de ganzá/pandeiro no mesmo pulso.
        metal=sum(np.sin(2*np.pi*f*t+phase)*np.exp(-t*decay)
                  for f,phase,decay in [(2780,.2,56),(3590,1.1,64),(4310,2.4,74)])
        texture=brazil_rng.normal(0,.12,len(t))*np.exp(-t*48)
        y=.55*y+.30*metal+.35*texture
    elif kind=='rim':
        # Madeira mais grave, como um aro tocado delicadamente; sem novos ataques.
        y=.55*y+.25*np.sin(2*np.pi*760*t)*np.exp(-t*82)
    return y*envelope(len(t),.001,.01)

def add(buf,y,at,gain=.1,pan=0,wrap=True):
    start=round(at*SR); stereo=y[:,None]*np.array([np.sqrt((1-pan)/2),np.sqrt((1+pan)/2)])[None,:]*gain
    for offset in range(0,len(y),len(buf)):
        part=stereo[offset:offset+len(buf)]; idx=(np.arange(len(part))+start+offset)%len(buf)
        if wrap: np.add.at(buf,idx,part)
        else:
            valid=(np.arange(len(part))+start+offset)<len(buf); buf[idx[valid]]+=part[valid]

# Voicings e linhas originais; cada tela possui fraseado e arranjo próprios.
CHORDS=[(48,[64,67,71,74]),(45,[60,64,67,71]),(50,[60,65,69,72]),(43,[59,65,69,74]),(52,[62,67,71,74]),(45,[61,67,70,76]),(50,[60,65,69,72]),(43,[59,65,68,74])]
THEMES=[
 ('01_inicio_Janela_na_Tijuca',74,'Início',[(0,76),(1.5,74),(2.5,71),(3.25,67)],1.0),
 ('02_catalogo_Passeio_no_Bairro',78,'Catálogo',[(.5,67),(1.25,71),(2,74),(2.75,76),(3.5,74)],1.0),
 ('03_niveis_Uma_Coisa_de_Cada_Vez',74,'Seleção de níveis',[(0,71),(1.75,74),(2.5,72)],.8),
 ('04_partida_Balanco_de_Quintal',80,'Partidas',[(.5,67),(1.5,69),(2.75,71)],.7),
 ('05_pausa_Sombra_na_Varanda',66,'Pausa',[(0,74),(2.5,71)],.3),
 ('06_rota_Volta_no_Bairro',78,'Roteiro da Volta no Bairro',[(0,72),(1,76),(1.75,74),(2.5,71),(3.25,69)],.95),
 ('07_parada_Ali_na_Esquina',76,'Próxima parada',[(0,72),(1.25,71),(2.75,76)],.65),
 ('08_resultado_Respira_e_Tenta',68,'Resultado da partida',[(.5,76),(2,71),(3,74)],.45),
 ('09_resumo_De_Volta_em_Casa',72,'Resumo da Volta no Bairro',[(0,79),(1.5,76),(2.5,74),(3.25,72)],.75)
]
tracks=[]; stats=[]
for index,(name,bpm,screen,motif,density) in enumerate(THEMES):
    beat=60/bpm; length=32*beat; buf=np.zeros((round(length*SR),2))
    for bar,(root,chord) in enumerate(CHORDS):
        base=bar*4*beat
        # Respiração da frase em dois compassos, sem perder o andamento médio.
        breath=[0,.008,-.004,.012,0,.006,-.003,.010][bar]
        phrase_gain=[1.05,.91,1.02,.87,1.07,.94,1.0,.84][bar]
        # Baixo e acordes desencontrados remetem à bossa sem caricatura.
        for pos,pitch,vel in [(0,root,1),(2,root+7,.6),(3.5,root+12,.25)]:
            add(buf,note(pitch,.55 if index!=4 else .75,'bass'),base+pos*beat+breath,.17*vel*phrase_gain)
        rhythm=[(0,.55),(1.5,.60),(2.75,.45)] if index!=4 else [(0,.6),(2.5,.45)]
        for pos,vel in rhythm:
            for j,n in enumerate(chord): add(buf,note(n,.55 if index!=4 else 1.25,'chord' if index!=4 else 'pad'),base+pos*beat+breath+[.002,.015,.030,.048][j]+performance_rng.uniform(-.003,.003),.055*vel*phrase_gain*[1,.91,.85,.77][j],(-.25+.17*j))
        # Frases consonantes com espaço entre respostas; sem transposições aleatórias.
        melody=[[(.5,76,1.15),(2.5,74,.7)],[(.75,71,.9),(2.75,69,.85)],[(.5,69,1.3),(2.5,72,.8)],[(1,71,1),(3,69,.65)],[(.5,71,1.1),(2.75,74,.7)],[(.75,73,.9),(2.5,70,1)],[(.5,69,1.1),(2.75,65,.75)],[(.75,67,1.3),(3,71,.55)]]
        phrase=melody[(bar+index*2)%8]
        # A variação de tela usa notas da harmonia do compasso para manter repouso.
        for pos,pitch,beats in phrase:
            if index and index!=4:
                candidates=[n+12*k for n in chord for k in [-1,0,1] if 65<=n+12*k<=79]
                pitch=min(candidates,key=lambda n:abs(n-pitch))
            if index==4 and pos>2: continue
            dur=beat*beats*(1.03 if pos<2 else .91)
            add(buf,note(pitch,dur),base+pos*beat+breath+(-.007 if pos<2 else .018),.055*max(.55,density)*phrase_gain*(1.12 if pos<2 else .84),.10)
            # Retirado o eco de ataque fixo; a sala abaixo mantém a profundidade.
        if index!=4:
            for pos in [0,2]: add(buf,drum('kick'),base+pos*beat,.065*density)
            for pos in [1.5,3.5]: add(buf,drum('rim'),base+pos*beat+.012+breath,.04*density*phrase_gain,-.18)
            for k in range(4): add(buf,drum('shaker'),base+(k+(.055 if k%2 else 0))*beat+breath+performance_rng.uniform(-.006,.006),.024*density*(1 if k%2 else .7)*performance_rng.uniform(.85,1.12),.35)
    # Reverb curto circular mantém a cauda ao repetir o loop, sem estalos de corte.
    wet=buf.copy()
    for delay,gain in [(.041,.10),(.073,.075),(.127,.045),(.191,.025)]: wet+=np.roll(buf,round(delay*SR),axis=0)[:,::-1]*gain
    wet=sosfilt(butter(2,4300,fs=SR,output='sos'),wet,axis=0)
    peak=np.max(np.abs(wet)); wet*=2.6; wet*=min(1,.84/np.max(np.abs(wet)))
    # Ganho unificado entre faixas: não maximizar cada trecho separadamente.
    tracks.append((name,screen,wet,bpm)); write(OUT/(name+'.wav'),SR,(wet*32767).astype(np.int16))
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(OUT/(name+'.wav')),'-codec:a','libmp3lame','-b:a','160k',str(OUT/(name+'.mp3'))],check=True)
    stats.append({'arquivo':name,'tela':screen,'bpm':bpm,'duracao':len(wet)/SR,'pico_dbfs':float(20*np.log10(np.max(np.abs(wet)))),'rms_dbfs':float(20*np.log10(np.sqrt(np.mean(wet**2))))})
# Demonstração de 12s por tela, intervalos de 0,7s e efeitos ao fim.
preview=[]; timestamps=[]; cursor=0
for name,screen,y,bpm in [tracks[0],tracks[3],tracks[4]]:
    clip=y[:22*SR].copy(); fade=np.minimum(1,np.arange(len(clip))/(.15*SR))*np.minimum(1,(len(clip)-np.arange(len(clip)))/(.4*SR)); clip*=fade[:,None]
    timestamps.append({'segundo':round(cursor,1),'tela':screen,'arquivo':name}); preview += [clip,np.zeros((round(.7*SR),2))]; cursor+=22.7
# Prévia concentrada na nova direção musical, sem efeitos ao final.
medley=np.concatenate(preview); write(OUT/'Miudezas_Interpretacao_Mais_Natural.wav',SR,(medley*32767).astype(np.int16))
subprocess.run(['ffmpeg','-v','error','-y','-i',str(OUT/'Miudezas_Interpretacao_Mais_Natural.wav'),'-b:a','192k',str(OUT/'Miudezas_Interpretacao_Mais_Natural.mp3')],check=True)
(OUT/'verificacao.json').write_text(json.dumps({'faixas':stats,'capitulos':timestamps},ensure_ascii=False,indent=2))
print(json.dumps(stats,ensure_ascii=False,indent=2))
