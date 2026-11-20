const fs=require('fs');eval(fs.readFileSync(process.argv[2]||'src/data.js','utf8')+';global.ROOMS=ROOMS');
const walk=c=>!'THRWBVFL#XYZQCsgOlmM[]Ku'.includes(c); // D (locked doors) count as passable
let ok=true;
for(const [k,r] of Object.entries(ROOMS)){
 if(r.map.length!==11){console.log(k,'rows',r.map.length);ok=false}
 r.map.forEach((row,i)=>{if(row.length!==16){console.log(k,'row',i,row.length,row);ok=false}});
 const [w,xy]=k.split(':');const [x,y]=xy.split(',').map(Number);
 const nb={l:`${w}:${x-1},${y}`,r:`${w}:${x+1},${y}`,u:`${w}:${x},${y-1}`,d:`${w}:${x},${y+1}`};
 for(let i=0;i<11;i++){
  const a=r.map[i]?.[0],b=r.map[i]?.[15];
  if(walk(a)&&a!=='G'){const n=ROOMS[nb.l];if(!n||!walk(n.map[i][15])){console.log(k,'left edge row',i,'->',nb.l,n?n.map[i][15]:'none');ok=false}}
  if(walk(b)&&b!=='G'){const n=ROOMS[nb.r];if(!n||!walk(n.map[i][0])){console.log(k,'right edge row',i,'->',nb.r,n?n.map[i][0]:'none');ok=false}}
 }
 for(let j=0;j<16;j++){
  const a=r.map[0][j],b=r.map[10][j];
  if(walk(a)&&a!=='G'){const n=ROOMS[nb.u];if(!n||!walk(n.map[10][j])){console.log(k,'top col',j,'->',nb.u,n?n.map[10][j]:'none');ok=false}}
  if(walk(b)&&b!=='G'){const n=ROOMS[nb.d];if(!n||!walk(n.map[0][j])){console.log(k,'bottom col',j,'->',nb.d,n?n.map[0][j]:'none');ok=false}}
 }
 const cnt=ch=>r.map.join('').split(ch).length-1;
 if((r.npcs||[]).length!==cnt('n'))console.log(k,'npcs mismatch'),ok=false;
 if((r.signs||[]).length!==cnt('s'))console.log(k,'signs mismatch'),ok=false;
 if((r.chests||[]).length!==cnt('C'))console.log(k,'chests mismatch'),ok=false;
 if((r.warps||[]).length!==cnt('E'))console.log(k,'warps mismatch'),ok=false;
}
let f=0;for(const r of Object.values(ROOMS))f+=r.map.join('').split('f').length-1;
console.log('fireflies placed',f,'ok',ok);
