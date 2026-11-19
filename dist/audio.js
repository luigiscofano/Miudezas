import {criarExclusividade} from './audio-exclusivo.js';
/** Trilhas, carregadas sob demanda; nenhuma rede/áudio antes do gesto. */
export const TRILHAS = Object.freeze(['inicio','galeria','nivel','jogo','pausa','roteiro','parada','resultado','resumo']);
export const OPCOES_TRILHA = Object.freeze({'bossa-janela':'Bossa de Janela','tarde-tijuca':'Tarde na Tijuca'});
export const normalizarTrilha = valor => Object.hasOwn(OPCOES_TRILHA,valor)?valor:'bossa-janela';
export const EFEITOS = Object.freeze(['selecionar','confirmar','voltar','acerto','erro','coleta','recorde','vitoria','derrota']);

export function criarAudio({contexto=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)(), buscar=(url)=>fetch(url),exclusividade=criarExclusividade}={}) {
  let ctx=null, master=null, fxBus=null, musica=null, habilitado=false, visivel=true, tela='inicio', jogo='', revisao=0,ciclo=0;
  const cache=new Map(), carregando=new Map(), fontes=new Set();
  let ultimoEfeito=-Infinity,volumeMusica=.10,volumeEfeitos=.05,geracaoEfeitos=0,prioridadePendente=0;
  const efeitosAtivos=new Map();
  let temaContinuo=null,posicaoMusical=0,escolha='bossa-janela';
  const posicoes=new Map();
  let licenca=false;
  const dono=exclusividade({aoCeder:()=>{parar();}});
  const ativo=()=>licenca&&habilitado&&visivel&&ctx?.state==='running';
  function encerrar(fonte){try{fonte.stop();}catch{} fontes.delete(fonte);}
  function parar(){
    licenca=false;dono.ceder();
    // Guardar a posição congela a música durante mute/aba oculta, sem voltar à introdução.
    if(musica)posicaoMusical=(musica.offset+Math.max(0,ctx.currentTime-musica.inicio))%musica.duracao;
    revisao++;ciclo++;geracaoEfeitos++;prioridadePendente=0;for(const fonte of fontes)encerrar(fonte);efeitosAtivos.clear();musica=null;}
  function ajustarGanho(parametro,valor,tempo){
    const agora=ctx.currentTime;
    // Um slider pode mudar durante o fade-in: não deixe a rampa antiga restaurar o volume.
    if(typeof parametro.cancelAndHoldAtTime==='function')parametro.cancelAndHoldAtTime(agora);
    else{const atual=parametro.value;parametro.cancelScheduledValues(agora);parametro.setValueAtTime(atual,agora);}
    parametro.setTargetAtTime(valor,agora,tempo);
  }
  function volume(){return tela==='jogo'&&['pisca','radio'].includes(jogo) ? volumeMusica/7 : volumeMusica;}
  async function carregar(chave){
    if(cache.has(chave)){const b=cache.get(chave);cache.delete(chave);cache.set(chave,b);return b;}
    if(carregando.has(chave))return carregando.get(chave);
    const promessa=(async()=>{
      const url=new URL('./audio/'+chave,import.meta.url);
      // Atualizar efeitos não deve reutilizar o arquivo instrumental de um cache antigo.
      if(chave.startsWith('efeitos/'))url.searchParams.set('v','8bit-b');
      const resposta=await buscar(url);
      if(!resposta.ok)throw new Error('Arquivo de áudio indisponível');
      const buffer=await ctx.decodeAudioData(await resposta.arrayBuffer());
      if(chave.startsWith('musicas/')&&chave!=='musicas/bossa-janela.flac'&&buffer.getChannelData){
        // Quatro milissegundos de borda evitam clique na emenda sem mudar o compasso.
        const n=Math.min(Math.round(buffer.sampleRate*.004),Math.floor(buffer.length/2));
        for(let c=0;c<buffer.numberOfChannels;c++){
          const canal=buffer.getChannelData(c);
          for(let i=0;i<n;i++){canal[i]*=i/n;canal[canal.length-1-i]*=i/n;}
        }
      }
      cache.set(chave,buffer);
      // Máximo de três músicas decodificadas; efeitos curtos ficam em memória.
      const musicas=[...cache.keys()].filter(k=>k.startsWith('musicas/'));
      while(musicas.length>3)cache.delete(musicas.shift());
      return buffer;
    })();
    carregando.set(chave,promessa);
    try{return await promessa;}finally{carregando.delete(chave);}
  }
  async function tocarTela(){
    if(!ativo()||musica)return;
    // A primeira tela sonorizada escolhe o tema; navegar não troca nem reinicia a faixa.
    temaContinuo??=tela;
    const versao=++revisao, destino=escolha==='bossa-janela'?'bossa-janela':temaContinuo;
    try{
      const buffer=await carregar('musicas/'+destino+'.flac');
      if(!ativo()||versao!==revisao)return;
      const fonte=ctx.createBufferSource(), ganho=ctx.createGain(), agora=ctx.currentTime;
      fonte.buffer=buffer;fonte.loop=true;fonte.connect(ganho);ganho.connect(master);
      ganho.gain.setValueAtTime(0,agora);ganho.gain.linearRampToValueAtTime(volume(),agora+.30);
      fontes.add(fonte);fonte.onended=()=>{fontes.delete(fonte);fonte.disconnect();ganho.disconnect();};
      const duracao=buffer.duration,offset=posicaoMusical%duracao;
      fonte.start(0,offset);musica={fonte,ganho,tela:destino,inicio:agora,offset,duracao};
    }catch{ /* O jogo continua em silêncio se rede ou decodificador falhar. */ }
  }
  async function ativar(valor=true){
    habilitado=valor;
    if(!valor){parar();if(master)master.gain.value=0;return;}
    if(!visivel)return;
    const versao=ciclo;
    try{
      if(!ctx){ctx=contexto();master=ctx.createGain();master.connect(ctx.destination);fxBus=ctx.createGain();fxBus.gain.value=volumeEfeitos;fxBus.connect(master);}
      master.gain.value=1;
      // Chamado diretamente por toque/clique/tecla, nunca pelo carregamento da página.
      if(ctx.state!=='running')await ctx.resume();
      if(versao!==ciclo||!habilitado||!visivel)return;
      const concedida=await dono.obter();
      if(!concedida||versao!==ciclo||!habilitado||!visivel)return;
      licenca=true;
      await tocarTela();
    }catch{ /* Preferência fica salva; outro gesto pode tentar novamente. */ }
  }
  function mudar(novaTela,id=''){
    if(!TRILHAS.includes(novaTela))return;
    tela=novaTela;jogo=id;
    if(musica)ajustarGanho(musica.ganho.gain,volume(),.08);
    else void tocarTela();
  }
  function visibilidade(valor){
    visivel=valor;
    if(!valor){parar();if(ctx?.state==='running')void ctx.suspend().catch(()=>{});}
    // Voltar à aba não inicia som sem uma nova interação.
  }
  async function efeito(nome){
    if(!ativo()||!EFEITOS.includes(nome))return;
    const prioridade=['vitoria','derrota'].includes(nome)?2:nome==='recorde'?1:0;
    if(!prioridade&&(prioridadePendente>0||ctx.currentTime-ultimoEfeito<.04))return;
    if(prioridade&&prioridade<prioridadePendente)return;
    if(prioridade){
      // A vitória do último alimento não pode ser engolida pelo acerto do mesmo quadro.
      geracaoEfeitos++;prioridadePendente=prioridade;
      for(const [fonte,nivel] of efeitosAtivos)if(nivel<=prioridade)encerrar(fonte);
    }
    ultimoEfeito=ctx.currentTime;
    const inicio=ctx.currentTime,versao=ciclo,geracao=geracaoEfeitos;
    try{
      const buffer=await carregar('efeitos/'+nome+'.wav');
      if(!ativo()||versao!==ciclo||geracao!==geracaoEfeitos||ctx.currentTime-inicio>.8||fontes.size>=10)return;
      const fonte=ctx.createBufferSource(),ganho=ctx.createGain();fonte.buffer=buffer;
      ganho.gain.value=1.2589;fonte.connect(ganho);ganho.connect(fxBus);fontes.add(fonte);efeitosAtivos.set(fonte,prioridade);
      fonte.onended=()=>{fontes.delete(fonte);efeitosAtivos.delete(fonte);fonte.disconnect();ganho.disconnect();};fonte.start();
    }catch{}finally{if(prioridade&&geracao===geracaoEfeitos)prioridadePendente=0;}
  }
  function sinal(hz,seg=.06){
    if(!ativo()||!Number.isFinite(hz)||!Number.isFinite(seg)||fontes.size>=10)return;
    // Frequências e durações informativas de Pisca/Rádio são preservadas.
    const fonte=ctx.createOscillator(),ganho=ctx.createGain(),agora=ctx.currentTime;
    fonte.type='square';fonte.frequency.value=Math.max(40,Math.min(4000,hz));
    ganho.gain.setValueAtTime(.035,agora);ganho.gain.exponentialRampToValueAtTime(.0005,agora+Math.max(.02,Math.min(1,seg)));
    fonte.connect(ganho);ganho.connect(fxBus);fontes.add(fonte);
    fonte.onended=()=>{fontes.delete(fonte);fonte.disconnect();ganho.disconnect();};fonte.start();fonte.stop(agora+Math.max(.02,Math.min(1,seg)));
  }
  function volumes(musicas,efeitos){
    volumeMusica=Number.isFinite(musicas)?Math.max(0,Math.min(1,musicas)):volumeMusica;
    volumeEfeitos=Number.isFinite(efeitos)?Math.max(0,Math.min(1,efeitos)):volumeEfeitos;
    if(fxBus)ajustarGanho(fxBus.gain,volumeEfeitos,.02);
    if(musica)ajustarGanho(musica.ganho.gain,volume(),.04);
  }
  function escolher(valor){
    const nova=normalizarTrilha(valor);
    if(nova===escolha)return;
    // Trocar música invalida downloads antigos sem interromper efeitos em andamento.
    if(musica){
      posicaoMusical=(musica.offset+Math.max(0,ctx.currentTime-musica.inicio))%musica.duracao;
      encerrar(musica.fonte);musica=null;
    }
    revisao++;posicoes.set(escolha,posicaoMusical);escolha=nova;
    posicaoMusical=posicoes.get(escolha)??0;
    void tocarTela();
  }
  return {ativar,mudar,visibilidade,efeito,sinal,parar,volumes,escolher};
}
