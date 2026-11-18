import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizarVolume,lerVolumes,criarConfiguracoes} from '../dist/configuracoes.js';

test('Volumes usam padrões, validam dados e limitam a porcentagem',()=>{
  assert.deepEqual(lerVolumes((k,p)=>p),{musica:10,efeitos:25});
  for(const valor of [null,undefined,'30',NaN,Infinity,{},true])assert.equal(normalizarVolume(valor,70),70);
  assert.equal(normalizarVolume(-1,70),0);assert.equal(normalizarVolume(200,70),100);assert.equal(normalizarVolume(42.6,70),43);
});
function ambiente(){
  const elementos=[];
  function criar(tag){const e={tag,children:[],attributes:{},events:{},open:false,append(...filhos){this.children.push(...filhos);},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,f){this.events[k]=f;},focus(){documento.activeElement=this;},showModal(){this.open=true;},close(){this.open=false;this.events.close?.();}};elementos.push(e);return e;}
  const barra=criar('div'),body=criar('body');
  const documento={createElement:criar,body,querySelector(s){return s==='.bar-actions'?barra:elementos.find(e=>'#'+e.id===s)||null;}};
  return {documento,encontrar:id=>elementos.find(e=>e.id===id),elementos,barra};
}
test('Configurações persistem canais independentes sem tocar no mute',()=>{
  const a=ambiente(),gravacoes=[],mudancas=[];
  const c=criarConfiguracoes({documento:a.documento,ler:(k,p)=>k==='volumeMusica'?35:p,salvar:(k,v)=>gravacoes.push([k,v]),aoMudar:v=>mudancas.push(v)});
  assert.deepEqual(c.volumes,{musica:35,efeitos:25});assert.equal(mudancas.length,1);assert.equal(gravacoes.length,0);
  const musica=a.encontrar('settings-musica');musica.valueAsNumber=22;musica.events.input();
  assert.deepEqual(c.volumes,{musica:22,efeitos:25});assert.deepEqual(gravacoes,[['volumeMusica',22]]);
  const efeitos=a.encontrar('settings-efeitos');efeitos.valueAsNumber=0;efeitos.events.input();assert.deepEqual(c.volumes,{musica:22,efeitos:0});
  a.elementos.find(e=>e.className==='settings-reset').events.click();assert.deepEqual(c.volumes,{musica:10,efeitos:25});assert.ok(!gravacoes.some(([k])=>k==='som'));
  const copia=c.volumes;copia.musica=999;assert.equal(c.volumes.musica,10);
});
test('Modal tem nome, pausa por callback, isola teclado e devolve foco',()=>{
  const a=ambiente();let abriu=0,parou=0,preveniu=0;
  criarConfiguracoes({documento:a.documento,ler:(k,p)=>p,salvar(){},aoAbrir(){abriu++;}});
  const botao=a.encontrar('settings'),dialogo=a.encontrar('configuracoes');assert.equal(botao.attributes['aria-label'],'Configurações');assert.equal(botao.attributes['aria-haspopup'],'dialog');
  botao.events.click();assert.equal(abriu,1);assert.equal(dialogo.open,true);botao.events.click();assert.equal(abriu,1);
  dialogo.events.keydown({key:'ArrowRight',stopPropagation(){parou++;},preventDefault(){preveniu++;}});assert.equal(parou,1);assert.equal(preveniu,0);
  dialogo.events.keydown({key:'Escape',stopPropagation(){parou++;},preventDefault(){preveniu++;}});assert.equal(dialogo.open,false);assert.equal(a.documento.activeElement,botao);assert.equal(preveniu,1);
  assert.throws(()=>criarConfiguracoes({documento:a.documento,ler:(k,p)=>p,salvar(){}}),/já inicializadas/);
});

test('Novos padrões não sobrescrevem volumes salvos, inclusive zero e antigos padrões',()=>{
  for(const [musica,efeitos] of [[0,0],[70,100],[35,62]]){
    const salvos={volumeMusica:musica,volumeEfeitos:efeitos};
    assert.deepEqual(lerVolumes((chave,padrao)=>salvos[chave]??padrao),{musica,efeitos});
  }
});
