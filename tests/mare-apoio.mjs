// Encontra comandos que expõem o caranguejo à próxima subida, sem alterar o jogo.
export function caminhoParaMare(estado) {
  const {grid,x,y,steps}=estado;
  const queue=[{x,y,phase:steps%6,path:[]}], seen=new Set();
  for(let head=0;head<queue.length;head++) {
    const at=queue[head];
    for(const [dir,dx,dy] of [['up',0,-1],['down',0,1],['left',-1,0],['right',1,0]]) {
      const nx=at.x+dx,ny=at.y+dy,cell=grid[ny]?.[nx];
      if(!cell||'#~C'.includes(cell)||(cell==='='&&at.phase>=3))continue;
      const phase=(at.phase+1)%6,path=[...at.path,dir];
      if(cell==='='&&phase===3)return path;
      const key=[nx,ny,phase].join(',');
      if(!seen.has(key)){seen.add(key);queue.push({x:nx,y:ny,phase,path});}
    }
  }
  throw new Error('Não foi encontrado caminho para a subida da maré.');
}
