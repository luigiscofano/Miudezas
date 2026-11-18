// Um worker por solicitação permite cancelar também o cálculo em andamento.
// Falhas nunca recorrem ao gerador síncrono na interface nem a mapas sem prova.
export function solicitarTerrenoGude(semente,criarWorker=()=>new Worker(new URL('./gude-worker.js',import.meta.url),{type:'module'})) {
  let worker,encerrado=false,rejeitar,temporizador;
  function limpar(){clearTimeout(temporizador);worker?.terminate();}
  const promise=new Promise((resolve,reject)=>{
    rejeitar=reject;
    const concluir=(erro,terreno)=>{
      if(encerrado)return;
      encerrado=true;limpar();erro?reject(erro):resolve(terreno);
    };
    try {
      worker=criarWorker();
      worker.onmessage=({data})=>{
        if(data?.erro||!data?.terreno||data.terreno.semente!==(Number(semente)>>>0)){
          concluir(new Error('Não foi possível preparar esta fase.'));return;
        }
        concluir(null,data.terreno);
      };
      worker.onerror=()=>concluir(new Error('Não foi possível preparar esta fase.'));
      worker.onmessageerror=worker.onerror;
      temporizador=setTimeout(()=>concluir(new Error('A preparação demorou demais. Tente novamente.')),30000);
      worker.postMessage({semente});
    } catch(erro){concluir(erro);}
  });
  return {promise,cancel(){
    if(encerrado)return;
    encerrado=true;limpar();
    const erro=new Error('Preparação cancelada.');erro.name='AbortError';rejeitar(erro);
  }};
}
