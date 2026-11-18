// Medição opcional em Chromium: requer Playwright instalado no ambiente.
// GUDE_ANTES=/tmp/varanda-antes.mjs node tests/gude-desempenho.mjs
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const {chromium}=createRequire(import.meta.url)('playwright');
const raiz=new URL('../dist/',import.meta.url);
const servidor=createServer(async(req,res)=>{
 try{
  const caminho=new URL(req.url,'http://localhost').pathname;
  if(caminho==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Medição Gude</title>');return;}
  const arquivo=caminho==='/antes.js'?process.env.GUDE_ANTES:fileURLToPath(new URL('.'+caminho,raiz));
  if(caminho!=='/antes.js'&&!arquivo.startsWith(fileURLToPath(raiz)))throw new Error('Caminho inválido');
  res.setHeader('Content-Type','text/javascript');res.end(await readFile(arquivo));
 }catch{res.statusCode=404;res.end();}
});
await new Promise(r=>servidor.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage(),cdp=await page.context().newCDPSession(page);
 await page.goto(`http://127.0.0.1:${servidor.address().port}/`);
 for(const taxa of [1,6]){
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:taxa});
  for(const modo of ['antes','otimizado','worker']){
   const dados=await page.evaluate(async({modo})=>{
    const antigo=await import('/antes.js'),atual=await import('/varanda.js'),{solicitarTerrenoGude}=await import('/gude-assincrono.js');
    const tempos=[],atrasos=[],tarefas=[];
    const observador=new PerformanceObserver(lista=>tarefas.push(...lista.getEntries().map(e=>e.duration)));
    observador.observe({type:'longtask'});
    for(let n=0;n<30;n++){
     let ultimo=performance.now(),atraso=0;
     const timer=setInterval(()=>{const agora=performance.now();atraso=Math.max(atraso,agora-ultimo-4);ultimo=agora;},4);
     await new Promise(r=>setTimeout(r,30));
     const inicio=performance.now();
     if(modo==='worker')await solicitarTerrenoGude(n*2).promise;
     else (modo==='antes'?antigo:atual).criarTerrenoGude(n*2);
     tempos.push(performance.now()-inicio);
     await new Promise(r=>setTimeout(r,30));clearInterval(timer);atrasos.push(atraso);
    }
    observador.disconnect();
    const resumo=a=>{a.sort((x,y)=>x-y);return {p50:a[14],p95:a[28],max:a[29]};};
    return {totalMs:resumo(tempos),atrasoTimerPrincipalMs:resumo(atrasos),tarefasLongasPrincipal:{quantidade:tarefas.length,maxMs:Math.max(0,...tarefas)}};
   },{modo});
   console.log(JSON.stringify({cpu:taxa,modo,sementes:'0..58 pares',...dados}));
  }
 }
}finally{await browser.close();servidor.close();}
