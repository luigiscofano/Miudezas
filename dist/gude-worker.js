import {criarTerrenoGude} from './varanda.js';

// O mesmo gerador conserva certificados, rejeição de atalhos e fallback.
self.onmessage=({data})=>{
  try {
    self.postMessage({terreno:criarTerrenoGude(data.semente)});
  } catch {
    self.postMessage({erro:'Não foi possível preparar esta fase.'});
  }
};
