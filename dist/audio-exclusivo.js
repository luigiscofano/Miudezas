/** A aba que recebe o gesto assume o áudio; Web Locks impede fontes simultâneas. */
export function criarExclusividade({aoCeder,canal=typeof window!=='undefined'?globalThis.BroadcastChannel:null,locks=typeof window!=='undefined'?globalThis.navigator?.locks:null}={}){
  // Fora do navegador, o player também pode ser usado por testes sem canais globais.
  const mensagens=canal?new canal('miudezas-audio'):null;
  let liberar=null,pendente=null,revisao=0;
  function ceder(){revisao++;liberar?.();liberar=null;pendente=null;}
  if(mensagens)mensagens.onmessage=()=>{aoCeder();ceder();};
  function obter(){
    if(liberar)return Promise.resolve(true);
    if(pendente)return pendente;
    const versao=++revisao;
    mensagens?.postMessage('assumir');
    if(!locks)return Promise.resolve(true);
    pendente=new Promise(resolve=>{
      locks.request('miudezas-audio',async()=>{
        if(versao!==revisao){resolve(false);return;}
        await new Promise(finalizar=>{liberar=finalizar;resolve(true);});
      }).catch(()=>{resolve(false);});
    });
    return pendente;
  }
  return {obter,ceder};
}
