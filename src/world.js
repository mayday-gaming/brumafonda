// ===================== MONDO / STANZE =====================
const THEME={
 ow:{floor:'#5f9c4f',floor2:'#68a656',wall:'#6b6f73',wallTop:'#8d9196',acc:'#ffd36b'},
 d1:{floor:'#4a3a4c',floor2:'#524255',wall:'#2b2030',wallTop:'#6b5470',acc:'#d08cff',moss:'#5f7a4a'},
 d2:{floor:'#2e4a52',floor2:'#35545c',wall:'#18292e',wallTop:'#4f7d86',acc:'#62f0dc',moss:'#3d6f6a'},
 d3:{floor:'#5c5045',floor2:'#66594c',wall:'#352c25',wallTop:'#a0866a',acc:'#ffc95a',moss:'#6d6a52'},
 d4:{floor:'#47624a',floor2:'#4e6b50',wall:'#25403a',wallTop:'#8fcfb8',acc:'#a8ff9c',moss:'#6a9a52'},
 fn:{floor:'#2b2134',floor2:'#33283d',wall:'#15101c',wallTop:'#4d3b60',acc:'#c59bff',moss:'#3e2f4c'}
};
const ENT_CHARS='123456789nfcj$kabQi';
const SOLID='THRWBVFL#XYDZCsgOlmu';
let room=null;
function gk(t,x,y){ return room.key+'|'+t+'|'+x+','+y; }

function loadRoom(key){
 const def=ROOMS[key]; const w=key.split(':')[0];
 const floor=def.floor||(w==='ow'?'.':'_');
 room={key,def,w,floor,dark:def.dark||0,grid:[],idx:{s:{},C:{},E:{},g:{}},blocks:[],plates:[],crystal:0,cache:null,dirty:true,jOpen:false,burnQ:[],frogI:0,bossKey:key+'|boss'};
 ents=[]; projs=[]; parts=[]; rings=[];
 const cnt={s:0,C:0,E:0,g:0,n:0,b:0,i:0};
 for(let y=0;y<CH;y++){ const row=[];
  for(let x=0;x<CW;x++){
   let c=def.map[y][x];
   if(ENT_CHARS.includes(c)){ spawnFromChar(c,x,y,cnt); c=floor; }
   if('sCEg'.includes(c)) room.idx[c][x+','+y]=cnt[c]++;
   if(c==='p') room.plates.push({x,y});
   if(c==='D'&&S.got[key+'|D|'+x+','+y]) c=floor;
   if(c==='Z'&&S.got[key+'|Z|'+x+','+y]) c=floor;
   if(c==='V'&&S.got[key+'|V|'+x+','+y]) c=w==='ow'?'P':floor;
   if(c==='X'&&S.got[key+'|X|'+x+','+y]) c='Y';
   row.push(c);
  }
  room.grid.push(row);
 }
 room.jOpen=!!S.got[key+'|clear'];
 if(def.boss){
  if(!S.got[room.bossKey]) spawnBoss(def.boss);
  else if(def.exit) ents.push(mkEnt('portal',8*TS,5.5*TS,{to:def.exit}));
 }
 S.visited[key]=1;
}
function spawnFromChar(c,x,y,cnt){
 const px=x*TS+TS/2, py=y*TS+TS/2+6;
 const id=room.key+'|'+c+'|'+x+','+y;
 switch(c){
  case '1': ents.push(mkEnt('muffolo',px,py)); break;
  case '2': ents.push(mkEnt('svolazzo',px,py)); break;
  case '3': ents.push(mkEnt('guardia',px,py)); break;
  case '4': ents.push(mkEnt('sputa',px,py)); break;
  case '5': ents.push(mkEnt('granchio',px,py)); break;
  case '6': ents.push(mkEnt('velo',px,py)); break;
  case '7': ents.push(mkEnt('scarabeo',px,py)); break;
  case '8': ents.push(mkEnt('spinarello',px,py)); break;
  case '9': ents.push(mkEnt('vespa',px,py)); break;
  case 'i': if(!S.got[id]) ents.push(mkEnt('ingr',px,py-4,{gid:id,ing:room.def.ingr[cnt.i]})); cnt.i++; break;
  case 'n': ents.push(mkEnt('npc',px,py,{id:room.def.npcs[cnt.n++]})); break;
  case 'f': if(!S.got[id]) ents.push(mkEnt('firefly',px,py-8,{gid:id})); break;
  case 'c': if(!S.got[id]) ents.push(mkEnt('piece',px,py-4,{gid:id})); break;
  case 'j': if(!S.got[id]) ents.push(mkEnt('page',px,py-4,{gid:id,page:PAGE_SRC[room.key]})); break;
  case '$': ents.push(mkEnt('shell',px,py-4,{val:hash(x,y)>0.6?5:1})); break;
  case 'k': if(!S.got[id]) ents.push(mkEnt('keyp',px,py,{gid:id})); break;
  case 'a': ents.push(mkEnt('cat',px,py)); break;
  case 'b': ents.push(mkEnt('frog',px,py,{col:room.def.frogs[cnt.b++]})); break;
  case 'Q': room.blocks.push({x,y,ox:0,oy:0,t:0}); break;
 }
}
function tileAt(tx,ty){ if(tx<0||ty<0||tx>=CW||ty>=CH) return null; return room.grid[ty][tx]; }
function setTile(tx,ty,c){ room.grid[ty][tx]=c; room.dirty=true; }
function blockAt(tx,ty){ return room.blocks.find(b=>b.x===tx&&b.y===ty); }
function neighborKey(dx,dy){ const [x,y]=[S.rx+dx,S.ry+dy]; const k=room.w+':'+x+','+y; return ROOMS[k]?k:null; }

// solidità per il giocatore
function solidP(tx,ty,ign){
 if(tx<0||tx>=CW||ty<0||ty>=CH){
  const ex=clamp(tx,0,CW-1), ey=clamp(ty,0,CH-1);
  const dx=tx<0?-1:tx>=CW?1:0, dy=ty<0?-1:ty>=CH?1:0;
  if(!neighborKey(dx,dy)) return true;
  return solidP(ex,ey,ign);
 }
 const c=room.grid[ty][tx];
 if(ign&&ign.has(tx+','+ty)&&'J[]'.includes(c)) return false;
 if(c==='J') return !room.jOpen;
 if(c==='M') return S.flames<3;
 if(c==='[') return room.crystal===0;
 if(c===']') return room.crystal===1;
 if(c==='W') return true;
 if(SOLID.includes(c)) return true;
 if(blockAt(tx,ty)) return true;
 return false;
}
function solidE(tx,ty){ // nemici di terra: evitano anche buche e acqua
 if(tx<0||tx>=CW||ty<0||ty>=CH) return true;
 const c=room.grid[ty][tx]; if(c==='G'||c==='E') return true; return solidP(tx,ty);
}
function solidF(tx,ty){ // volanti: solo muri
 if(tx<0||tx>=CW||ty<0||ty>=CH) return true;
 const c=room.grid[ty][tx]; return '#THR'.includes(c)||(c==='J'&&!room.jOpen);
}
function solidProj(tx,ty){ // proiettili/rampino: passano su acqua e buche
 if(tx<0||tx>=CW||ty<0||ty>=CH) return true;
 const c=room.grid[ty][tx]; if(c==='W'||c==='G'||c==='w') return false; return solidP(tx,ty);
}
function boxHit(x0,y0,x1,y1,fn,ign){
 const a=Math.floor(x0/TS), b=Math.floor((x1-0.01)/TS), c=Math.floor(y0/TS), d=Math.floor((y1-0.01)/TS);
 for(let ty=c;ty<=d;ty++) for(let tx=a;tx<=b;tx++) if(fn(tx,ty,ign)) return {tx,ty};
 return null;
}
// muove un'entità con box (hw: mezza larghezza, ht/hb sopra/sotto i piedi)
function moveBox(e,dx,dy,fn,hw=7,ht=6,hb=3,nudge=false,ign){
 let hitX=null, hitY=null;
 if(dx){ const nx=e.x+dx; const h=boxHit(nx-hw,e.y-ht,nx+hw,e.y+hb,fn,ign);
  if(!h) e.x=nx; else { hitX=h;
   if(nudge){ for(let o=1;o<=11;o++){ let done=false; for(const s of [-1,1]){ const oy=e.y+s*o;
     if(!boxHit(nx-hw,oy-ht,nx+hw,oy+hb,fn,ign)){ e.y+=s*Math.min(o,Math.abs(dx)+0.6); done=true; break; } } if(done) break; } }
  } }
 if(dy){ const ny=e.y+dy; const h=boxHit(e.x-hw,ny-ht,e.x+hw,ny+hb,fn,ign);
  if(!h) e.y=ny; else { hitY=h;
   if(nudge){ for(let o=1;o<=11;o++){ let done=false; for(const s of [-1,1]){ const ox=e.x+s*o;
     if(!boxHit(ox-hw,ny-ht,ox+hw,ny+hb,fn,ign)){ e.x+=s*Math.min(o,Math.abs(dy)+0.6); done=true; break; } } if(done) break; } }
  } }
 return {hitX,hitY};
}

// condizioni delle saracinesche
function updateRoomLogic(dt){
 const def=room.def;
 if(def.open && !room.jOpen){
  let ok=false;
  if(def.open==='enemies') ok=!ents.some(e=>e.enemy&&!e.dead);
  if(def.open==='torches') ok=!room.grid.some(r=>r.includes('X'));
  if(def.open==='plate') ok=room.plates.length>0&&room.plates.every(p=>{ const b=blockAt(p.x,p.y); return b&&b.t<=0; });
  if(ok){ room.jOpen=true; S.got[room.key+'|clear']=1; AU.sfx('open'); shake=6; floatText(P.x,P.y-40,'Un passaggio si è aperto!','#ffe9a8'); save(); }
 }
 // bruciatura a catena dei rovi
 for(const b of room.burnQ){ b.t-=dt; if(b.t<=0) burnTile(b.x,b.y); }
 room.burnQ=room.burnQ.filter(b=>b.t>0);
 // blocchi in movimento
 for(const b of room.blocks){ if(b.t>0){ b.t-=dt; const k=Math.max(0,b.t/0.22); b.ox=b.dx*-TS*k; b.oy=b.dy*-TS*k; if(b.t<=0){b.t=0; b.ox=b.oy=0; if(room.plates.some(p=>p.x===b.x&&p.y===b.y)) AU.sfx('plate');} } }
}
function burnTile(x,y){
 if(tileAt(x,y)!=='V') return;
 setTile(x,y,room.w==='ow'?'P':room.floor); S.got[gk('V',x,y)]=1;
 AU.sfx('burn');
 for(let i=0;i<14;i++) addPart({x:x*TS+16+rand(-12,12),y:y*TS+16+rand(-12,12),vx:rand(-30,30),vy:rand(-90,-20),life:rand(0.5,1.1),col:pick(['#ffb347','#ff6a2b','#ffe08a','#5a3a2a']),size:rand(2,4),type:'ember'});
 for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if(tileAt(x+dx,y+dy)==='V'&&!room.burnQ.some(b=>b.x===x+dx&&b.y===y+dy)) room.burnQ.push({x:x+dx,y:y+dy,t:0.14});
 if(Math.random()<0.25) ents.push(mkEnt('shell',x*TS+16,y*TS+20,{val:1}));
}
function lightTorch(x,y){
 if(tileAt(x,y)!=='X') return;
 setTile(x,y,'Y'); S.got[gk('X',x,y)]=1; S.stats.torches++; AU.sfx('torch');
 if(S.stats.torches>=12) award('accendi');
 for(let i=0;i<10;i++) addPart({x:x*TS+16,y:y*TS+10,vx:rand(-40,40),vy:rand(-80,-20),life:0.6,col:'#ffcf6b',size:3,type:'ember'});
}
function shatterTile(x,y){
 if(tileAt(x,y)!=='Z') return;
 setTile(x,y,room.w==='ow'?'.':room.floor); S.got[gk('Z',x,y)]=1; AU.sfx('shatter'); shake=5;
 for(let i=0;i<18;i++) addPart({x:x*TS+16,y:y*TS+16,vx:rand(-130,130),vy:rand(-160,40),life:rand(0.5,0.9),col:pick(['#cfe8ff','#9fb6c8','#ffffff','#7a8590']),size:rand(2,5),type:'glass',g:300});
 if(room.def.boss&&Math.random()<0.7) ents.push(mkEnt('heart',x*TS+16,y*TS+22));
}

// ===================== RENDER TILES =====================
function rr(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
function circ(g,x,y,r){ g.beginPath(); g.arc(x,y,r,0,Math.PI*2); }
function ell(g,x,y,rx,ry){ g.beginPath(); g.ellipse(x,y,Math.max(0.1,rx),Math.max(0.1,ry),0,0,Math.PI*2); }

function drawGround(g,c,x,y,tx,ty){
 const th=THEME[room.w], h=hash(tx,ty);
 if(room.w==='ow'){
  if(c==='S'){ g.fillStyle='#e8d198'; g.fillRect(x,y,TS,TS); g.strokeStyle='rgba(180,150,90,.35)'; g.lineWidth=1; g.beginPath(); g.moveTo(x+4,y+10+h*8); g.quadraticCurveTo(x+16,y+6+h*8,x+28,y+12+h*8); g.stroke(); return; }
  if(c==='P'||c==='='||c==='E'){ g.fillStyle='#caa36a'; g.fillRect(x,y,TS,TS); g.fillStyle='rgba(120,90,50,.35)'; for(let i=0;i<3;i++) circ(g,x+hash(tx,ty,i)*TS,y+hash(tx,ty,i+5)*TS,1.6),g.fill(); return; }
  if(c==='w'){ g.fillStyle='#4f6f4a'; g.fillRect(x,y,TS,TS); g.fillStyle='rgba(90,160,170,.55)'; g.fillRect(x,y,TS,TS); return; }
  const dk=room.key==='ow:3,1'||room.key==='ow:3,0'||room.key==='ow:0,3';
  g.fillStyle= dk ? '#4a6a4a' : '#64a052'; g.fillRect(x,y,TS,TS);
  for(let i=0;i<3;i++){ const bx=x+hash(tx,ty,i+60)*TS, by=y+hash(tx,ty,i+70)*TS, r=8+hash(tx,ty,i+80)*10; const gr=g.createRadialGradient(bx,by,0,bx,by,r); gr.addColorStop(0,i?'rgba(255,250,200,.10)':'rgba(30,70,50,.12)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(bx-r,by-r,r*2,r*2); }
  return;
 }
 // dungeon
 g.fillStyle=((tx+ty)%2)?th.floor:th.floor2; g.fillRect(x,y,TS,TS);
 g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=1; g.strokeRect(x+0.5,y+0.5,TS-1,TS-1);
 if(h>0.8){ g.strokeStyle='rgba(0,0,0,.25)'; g.beginPath(); g.moveTo(x+6,y+8); g.lineTo(x+13,y+15); g.lineTo(x+11,y+22); g.stroke(); }
 if(h<0.12&&th.moss){ g.fillStyle=th.moss; g.globalAlpha=0.5; circ(g,x+10,y+24,5); g.fill(); circ(g,x+15,y+26,4); g.fill(); g.globalAlpha=1; }
}
function baseFor(c){ return room.floor; }
function drawStaticTile(g,c,tx,ty){
 const x=tx*TS,y=ty*TS, th=THEME[room.w], h=hash(tx,ty);
 if('.,PSw_='.includes(c)){ if(c==='='){ drawWaterBase(g,x,y); g.fillStyle='#9a6b3f'; g.fillRect(x,y+3,TS,TS-6); g.strokeStyle='#6d4727'; g.lineWidth=2; for(let i=0;i<4;i++){g.beginPath();g.moveTo(x+i*8+4,y+3);g.lineTo(x+i*8+4,y+TS-3);g.stroke();} g.fillStyle='rgba(255,220,160,.2)'; g.fillRect(x,y+3,TS,3); return;}
   drawGround(g,c,x,y,tx,ty); return; }
 if(c==='W'){ drawWaterBase(g,x,y); // schiuma ai bordi
   g.strokeStyle='rgba(220,250,255,.55)'; g.lineWidth=2.5;
   const nb=(dx,dy)=>{const t=tileAt(tx+dx,ty+dy); return t!==null&&t!=='W'&&t!=='=';};
   g.beginPath(); if(nb(0,-1)){g.moveTo(x,y+2);g.lineTo(x+TS,y+2);} if(nb(0,1)){g.moveTo(x,y+TS-2);g.lineTo(x+TS,y+TS-2);} if(nb(-1,0)){g.moveTo(x+2,y);g.lineTo(x+2,y+TS);} if(nb(1,0)){g.moveTo(x+TS-2,y);g.lineTo(x+TS-2,y+TS);} g.stroke(); return; }
 if(c==='G'){ g.fillStyle='#07050c'; g.fillRect(x,y,TS,TS);
   if(tileAt(tx,ty-1)!=='G'){ const gr=g.createLinearGradient(0,y,0,y+14); gr.addColorStop(0,room.w==='ow'?'#6b5a48':th.wallTop); gr.addColorStop(1,'#07050c'); g.fillStyle=gr; g.fillRect(x,y,TS,14); }
   g.fillStyle='rgba(120,100,180,.12)'; circ(g,x+16,y+20,3); g.fill(); return; }
 if(c==='#'&&room.key==='ow:0,0'){ // facciata della serra di vetro
   const gr=g.createLinearGradient(x,y,x+TS,y+TS); gr.addColorStop(0,'#cdeee6'); gr.addColorStop(1,'#8fc8c0'); g.fillStyle=gr; g.fillRect(x,y,TS,TS);
   g.fillStyle='rgba(120,200,120,.35)'; circ(g,x+8+hash(tx,ty)*16,y+22,7); g.fill(); circ(g,x+20,y+26,5); g.fill();
   g.fillStyle='rgba(255,255,255,.45)'; g.beginPath(); g.moveTo(x+4,y+2); g.lineTo(x+12,y+2); g.lineTo(x+4,y+14); g.fill();
   g.strokeStyle='#4a6a5a'; g.lineWidth=2.5; g.strokeRect(x+1,y+1,TS-2,TS-2); g.lineWidth=1.5; g.beginPath(); g.moveTo(x+16,y); g.lineTo(x+16,y+TS); g.moveTo(x,y+16); g.lineTo(x+TS,y+16); g.stroke();
   if(tileAt(tx,ty-1)!=='#'){ g.fillStyle='#3a5a4a'; g.fillRect(x,y,TS,4); }
   return; }
 if(c==='#'||(c==='Z'&&room.w!=='ow')){ const below=tileAt(tx,ty+1); const face=below!==null&&below!=='#'&&below!=='Z';
   g.fillStyle=th.wallTop; g.fillRect(x,y,TS,TS); g.fillStyle=th.wall; g.fillRect(x+1,y+1,TS-2,TS-2);
   g.strokeStyle='rgba(255,255,255,.07)'; g.lineWidth=1; for(let r=0;r<4;r++){ g.beginPath(); g.moveTo(x,y+r*8+0.5); g.lineTo(x+TS,y+r*8+0.5); g.stroke(); const o=(r%2)*8; for(let k=0;k<3;k++){ g.beginPath(); g.moveTo(x+o+k*16+0.5,y+r*8); g.lineTo(x+o+k*16+0.5,y+r*8+8); g.stroke(); } }
   if(face){ g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x,y+TS-9,TS,9); g.fillStyle=th.wallTop; g.globalAlpha=0.35; g.fillRect(x,y+TS-10,TS,1.5); g.globalAlpha=1; }
   if(c==='Z'){ drawCracks(g,x,y,'#d9ecff'); }
   return; }
 if(c==='O'&&[[1,0],[-1,0],[0,1],[0,-1]].filter(([a,b])=>tileAt(tx+a,ty+b)==='W').length>=2) drawWaterBase(g,x,y); else drawGround(g,baseFor(c),x,y,tx,ty);
 switch(c){
  case 'T': { g.fillStyle='rgba(46,28,72,.22)'; g.beginPath(); g.ellipse(x+26,y+28,20,7,0.3,0,6.28); g.fill(); g.fillStyle='rgba(46,28,72,.28)'; ell(g,x+16,y+27,12,4.5); g.fill(); g.fillStyle='#6b4630'; rr(g,x+12.5,y+14,7,15,2); g.fill(); g.fillStyle='rgba(255,220,180,.18)'; g.fillRect(x+13.5,y+15,2,12); break;
    g.fillStyle='#5b3a24'; g.fillRect(x+13,y+18,6,10);
    const dk=room.key==='ow:3,1'||room.key==='ow:0,3'; const cols=dk?['#2c4a35','#355840','#406b4b']:['#2f6b3a','#3b8146','#4e9a54'];
    g.fillStyle=cols[0]; circ(g,x+16,y+13,15); g.fill(); g.fillStyle=cols[1]; circ(g,x+12,y+11,10); g.fill(); circ(g,x+21,y+12,9); g.fill(); g.fillStyle=cols[2]; circ(g,x+11,y+7,6); g.fill(); circ(g,x+19,y+6,4.5); g.fill();
    if(h>0.7){ g.fillStyle='#e05a4a'; circ(g,x+9+h*10,y+14,2); g.fill(); } break; }
  case 'R': { g.fillStyle='rgba(0,0,0,.25)'; ell(g,x+16,y+27,14,5); g.fill(); g.fillStyle='#6f7378'; g.beginPath(); g.moveTo(x+3,y+26); g.lineTo(x+5,y+10); g.lineTo(x+14,y+3); g.lineTo(x+26,y+6); g.lineTo(x+30,y+20); g.lineTo(x+26,y+28); g.closePath(); g.fill(); g.fillStyle='#8e9398'; g.beginPath(); g.moveTo(x+6,y+12); g.lineTo(x+14,y+5); g.lineTo(x+24,y+8); g.lineTo(x+18,y+14); g.closePath(); g.fill(); g.strokeStyle='rgba(0,0,0,.2)'; g.beginPath(); g.moveTo(x+18,y+14); g.lineTo(x+20,y+24); g.stroke(); break; }
  case 'Z': { // roccia incrinata (overworld)
    g.fillStyle='#7a7166'; g.beginPath(); g.moveTo(x+3,y+28); g.lineTo(x+4,y+8); g.lineTo(x+16,y+2); g.lineTo(x+28,y+8); g.lineTo(x+29,y+28); g.closePath(); g.fill(); drawCracks(g,x,y,'#f4e9d0'); break; }
  case 'B': { g.fillStyle='rgba(0,0,0,.22)'; ell(g,x+16,y+26,13,5); g.fill(); g.fillStyle='#3f8a3c'; circ(g,x+16,y+17,11); g.fill(); g.fillStyle='#55a84b'; circ(g,x+11,y+14,6); g.fill(); circ(g,x+20,y+13,6); g.fill(); g.fillStyle='#7cc565'; circ(g,x+13,y+11,2.5); g.fill(); circ(g,x+21,y+10,2); g.fill(); break; }
  case 'V': { g.strokeStyle='#4b1f37'; g.lineWidth=4; for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(x+2,y+8+i*9); g.bezierCurveTo(x+10,y+i*9,x+20,y+16+i*9,x+30,y+6+i*9); g.stroke(); }
    g.strokeStyle='#7a3358'; g.lineWidth=2; for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(x+2,y+8+i*9); g.bezierCurveTo(x+10,y+i*9,x+20,y+16+i*9,x+30,y+6+i*9); g.stroke(); }
    g.fillStyle='#d9a3c4'; for(let i=0;i<7;i++){ const sx=x+hash(tx,ty,i)*28+2, sy=y+hash(tx,ty,i+3)*28+2; g.beginPath(); g.moveTo(sx,sy); g.lineTo(sx+2,sy-4); g.lineTo(sx+4,sy); g.fill(); } break; }
  case 'F': { g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(x,y+24,TS,4); g.fillStyle='#a77a4c'; g.fillRect(x,y+10,TS,4); g.fillRect(x,y+18,TS,4); g.fillStyle='#8a6038'; g.fillRect(x+4,y+6,5,20); g.fillRect(x+21,y+6,5,20); break; }
  case 'H': { const roof=tileAt(tx,ty-1)!=='H';
    if(roof){ g.fillStyle='#b5523b'; g.fillRect(x,y+4,TS,TS-4); g.fillStyle='#cf6a4c'; for(let r=0;r<3;r++) for(let k=0;k<4;k++){ rr(g,x+k*8+(r%2)*4-2,y+6+r*8,8,7,3); g.fill(); } g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(x,y+TS-3,TS,3);
     if(tileAt(tx-1,ty)!=='H'){ g.fillStyle='#8f3f2d'; g.fillRect(x,y+4,3,TS-4);} if(tileAt(tx+1,ty)!=='H'){ g.fillStyle='#8f3f2d'; g.fillRect(x+TS-3,y+4,3,TS-4);} }
    else { g.fillStyle='#eadbb8'; g.fillRect(x,y,TS,TS); g.fillStyle='#8a6038'; g.fillRect(x,y,TS,3); g.fillRect(x,y+TS-4,TS,4); if(tileAt(tx-1,ty)!=='H') g.fillRect(x,y,4,TS); if(tileAt(tx+1,ty)!=='H') g.fillRect(x+TS-4,y,4,TS);
     if((tx+ty)%2===0){ g.fillStyle='#ffd27a'; rr(g,x+9,y+8,14,12,2); g.fill(); g.strokeStyle='#6d4727'; g.lineWidth=2; g.strokeRect(x+9,y+8,14,12); g.beginPath(); g.moveTo(x+16,y+8); g.lineTo(x+16,y+20); g.stroke(); }
     else { g.fillStyle='#6d4727'; rr(g,x+9,y+8,14,20,3); g.fill(); g.fillStyle='#ffcf6b'; circ(g,x+20,y+19,1.5); g.fill(); } }
    break; }
  case 's': { g.fillStyle='rgba(0,0,0,.25)'; ell(g,x+16,y+27,9,3); g.fill(); g.fillStyle='#7a5230'; g.fillRect(x+14,y+14,4,14); g.fillStyle='#b8874f'; rr(g,x+5,y+5,22,13,2); g.fill(); g.strokeStyle='#7a5230'; g.lineWidth=1.5; g.strokeRect(x+5,y+5,22,13); g.strokeStyle='rgba(80,50,20,.6)'; g.lineWidth=1; for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(x+8,y+9+i*3); g.lineTo(x+24-i*3,y+9+i*3); g.stroke(); } break; }
  case 'g': { g.fillStyle='rgba(0,0,0,.3)'; ell(g,x+16,y+27,10,4); g.fill(); g.fillStyle='#8b8f99'; g.beginPath(); g.moveTo(x+7,y+27); g.lineTo(x+7,y+12); g.arc(x+16,y+12,9,Math.PI,0); g.lineTo(x+25,y+27); g.closePath(); g.fill(); g.fillStyle='#a8adb8'; g.fillRect(x+9,y+11,3,15); g.strokeStyle='#5c606a'; g.lineWidth=1.5; g.beginPath(); g.moveTo(x+16,y+9); g.lineTo(x+16,y+19); g.moveTo(x+12,y+13); g.lineTo(x+20,y+13); g.stroke(); break; }
  case 'O': { g.fillStyle='rgba(0,0,0,.3)'; ell(g,x+16,y+27,8,3); g.fill(); g.fillStyle='#6b4a2e'; rr(g,x+11,y+6,10,22,3); g.fill(); g.fillStyle='#8c6440'; g.fillRect(x+12,y+7,3,20); g.strokeStyle='#d9b45a'; g.lineWidth=3; circ(g,x+16,y+8,6); g.stroke(); g.strokeStyle='#fff1b0'; g.lineWidth=1; g.beginPath(); g.arc(x+16,y+8,6,3.6,4.6); g.stroke(); break; }
  case 'm': { const col=room.w==='ow'?(h>0.5?'#d9483b':'#9b5bd6'):(h>0.5?'#b16bd8':'#5fd0b9');
    g.fillStyle='rgba(0,0,0,.25)'; ell(g,x+16,y+27,10,4); g.fill(); g.fillStyle='#efe3c9'; rr(g,x+12,y+14,8,13,3); g.fill(); g.fillStyle=col; g.beginPath(); g.ellipse(x+16,y+14,13,9,0,Math.PI,0); g.fill(); g.fillStyle='rgba(255,255,255,.8)'; circ(g,x+10,y+11,2); g.fill(); circ(g,x+19,y+9,2.5); g.fill(); circ(g,x+23,y+12,1.5); g.fill(); break; }
  case 'u': { g.fillStyle='#6b4a2e'; ell(g,x+16,y+20,10,7); g.fill(); g.fillStyle='#c79a63'; ell(g,x+16,y+17,9,5); g.fill(); break; }
  case 'E': { if(room.key==='ow:0,0'){ g.fillStyle='#3a5a4a'; g.fillRect(x+3,y,TS-6,TS); g.fillStyle='#bfe8dc'; g.fillRect(x+6,y+3,TS-12,TS-3); g.strokeStyle='#3a5a4a'; g.lineWidth=1.5; g.beginPath(); g.moveTo(x+16,y+3); g.lineTo(x+16,y+TS); g.stroke(); g.fillStyle='#e8c060'; circ(g,x+13,y+18,1.6); g.fill(); circ(g,x+19,y+18,1.6); g.fill(); break; }
    if(room.w==='ow'){ g.fillStyle='#14101a'; g.beginPath(); g.moveTo(x+3,y+TS); g.lineTo(x+3,y+12); g.arc(x+16,y+12,13,Math.PI,0); g.lineTo(x+29,y+TS); g.closePath(); g.fill(); g.strokeStyle='#4a4048'; g.lineWidth=3; g.stroke(); }
    else { g.fillStyle='#120e18'; g.fillRect(x+3,y+3,TS-6,TS-6); g.fillStyle=th.wallTop; for(let i=0;i<4;i++) g.fillRect(x+5,y+6+i*6,TS-10,2); } break; }
 }
}
function drawCracks(g,x,y,col){ g.strokeStyle=col; g.lineWidth=1.6; g.beginPath(); g.moveTo(x+16,y+4); g.lineTo(x+13,y+12); g.lineTo(x+18,y+17); g.lineTo(x+12,y+26); g.moveTo(x+18,y+17); g.lineTo(x+25,y+21); g.moveTo(x+13,y+12); g.lineTo(x+7,y+14); g.stroke(); }
function drawWaterBase(g,x,y){ const d2=room.w==='d2'; g.fillStyle=d2?'#1f5f73':'#2f7fb0'; g.fillRect(x,y,TS,TS); g.fillStyle=d2?'#236a80':'#3a8dc0'; g.fillRect(x,y+TS/2,TS,TS/2); }

function buildCache(){
 if(!room.cache){ room.cache=document.createElement('canvas'); room.cache.width=VW*2; room.cache.height=VH*2; }
 const g=room.cache.getContext('2d'); g.setTransform(2,0,0,2,0,0); g.clearRect(0,0,VW,VH);
 const dyn='LXYDJpCM[]l';
 for(let ty=0;ty<CH;ty++) for(let tx=0;tx<CW;tx++){ const c=room.grid[ty][tx]; if(dyn.includes(c)) drawGround(g, c==='L'?'P':baseFor(c), tx*TS,ty*TS,tx,ty); }
 // prima terreno, poi oggetti alti (alberi sovrapposti dall'alto verso il basso)
 for(let ty=0;ty<CH;ty++) for(let tx=0;tx<CW;tx++){ const c=room.grid[ty][tx]; if(!dyn.includes(c)&&c!=='T') drawStaticTile(g,c,tx,ty); }
 for(let ty=0;ty<CH;ty++) for(let tx=0;tx<CW;tx++){ const c=room.grid[ty][tx]; if(c==='T') drawStaticTile(g,c,tx,ty); }
 watercolorize(room.cache,room.key);
 room.trees=[]; for(let ty=0;ty<CH;ty++) for(let tx=0;tx<CW;tx++) if(room.grid[ty][tx]==='T') room.trees.push([tx,ty]);
 room.dirty=false;
}

// tile dinamici (animati o con stato)
function drawDynTiles(g){
 const th=THEME[room.w];
 for(let ty=0;ty<CH;ty++) for(let tx=0;tx<CW;tx++){
  const c=room.grid[ty][tx], x=tx*TS, y=ty*TS;
  switch(c){
   case 'W': { const t=T*1.4+tx*0.7+ty*0.4; g.strokeStyle='rgba(255,255,255,.18)'; g.lineWidth=1.5; g.beginPath(); const o=Math.sin(t)*4; g.moveTo(x+4+o,y+10); g.quadraticCurveTo(x+10+o,y+7,x+16+o,y+10); g.moveTo(x+14-o,y+22); g.quadraticCurveTo(x+20-o,y+19,x+26-o,y+22); g.stroke();
     if(hash(tx,ty,(T*2)|0)>0.985){ addPart({x:x+rand(4,28),y:y+rand(4,28),vx:0,vy:0,life:0.6,col:'#e8fbff',size:2,type:'spark'}); } break; }
   case 'X': case 'Y': { g.fillStyle='rgba(0,0,0,.3)'; ell(g,x+16,y+28,10,3.5); g.fill(); g.fillStyle='#4b4450'; rr(g,x+8,y+14,16,14,3); g.fill(); g.fillStyle='#6d6573'; rr(g,x+6,y+10,20,7,3); g.fill(); g.fillStyle='#2a242e'; ell(g,x+16,y+12,8,2.5); g.fill();
     if(c==='Y'){ const f=Math.sin(T*18+tx)*1.5; const gr=g.createRadialGradient(x+16,y+6,1,x+16,y+6,12); gr.addColorStop(0,'#fff6c2'); gr.addColorStop(0.4,'#ffb43a'); gr.addColorStop(1,'rgba(255,90,20,0)'); g.fillStyle=gr; g.beginPath(); g.moveTo(x+9,y+12); g.quadraticCurveTo(x+10+f,y-2,x+16,y-8+f); g.quadraticCurveTo(x+22-f,y-2,x+23,y+12); g.closePath(); g.fill();
       if(Math.random()<0.08) addPart({x:x+16+rand(-4,4),y:y+2,vx:rand(-10,10),vy:rand(-50,-30),life:0.7,col:'#ffcf6b',size:1.6,type:'ember'}); } break; }
   case 'L': { if(tileAt(tx-1,ty)==='L'||tileAt(tx,ty-1)==='L') break; drawGreatLantern(g,x+32,y+50); break; }
   case 'D': { g.fillStyle=th.wall; g.fillRect(x,y,TS,TS); g.fillStyle='#7a4f2c'; rr(g,x+2,y+2,TS-4,TS-4,3); g.fill(); g.strokeStyle='#4d2f19'; g.lineWidth=2; for(let i=1;i<4;i++){ g.beginPath(); g.moveTo(x+i*8,y+3); g.lineTo(x+i*8,y+TS-3); g.stroke(); }
     g.fillStyle='#c9a24a'; circ(g,x+16,y+15,5); g.fill(); g.fillStyle='#2a1a0e'; circ(g,x+16,y+14,1.8); g.fill(); g.fillRect(x+15,y+14,2,5); break; }
   case 'J': { const k=room.jOpen?0:1; g.fillStyle=room.w==='ow'?'#5a4a3a':th.wall; g.globalAlpha=0.4; g.fillRect(x,y,TS,TS); g.globalAlpha=1; if(k){ g.fillStyle='#3d3542'; g.fillRect(x,y,TS,TS); g.fillStyle='#8b8094'; for(let i=0;i<4;i++){ rr(g,x+3+i*7,y+1,4,TS-2,2); g.fill(); } g.fillStyle=th.acc; g.globalAlpha=0.5+Math.sin(T*3)*0.2; g.fillRect(x,y+TS/2-1,TS,2); g.globalAlpha=1; } break; }
   case 'p': { const on=!!blockAt(tx,ty)||(P&&Math.floor(P.x/TS)===tx&&Math.floor((P.y-2)/TS)===ty); g.fillStyle='#2b2630'; rr(g,x+4,y+4,TS-8,TS-8,4); g.fill(); g.fillStyle=on?'#7de0a0':th.acc; rr(g,x+7,y+(on?9:7),TS-14,TS-14-(on?2:0),3); g.fill(); g.fillStyle='rgba(255,255,255,.25)'; g.fillRect(x+8,y+(on?10:8),TS-16,2); break; }
   case 'C': { const open=!!S.got[gk('C',tx,ty)]; g.fillStyle='rgba(0,0,0,.3)'; ell(g,x+16,y+28,13,4); g.fill(); g.fillStyle='#8a5a2b'; rr(g,x+4,y+12,24,16,3); g.fill(); g.fillStyle='#d6a648'; g.fillRect(x+4,y+17,24,3); g.fillRect(x+14,y+12,4,16);
     if(open){ g.fillStyle='#3a2414'; rr(g,x+5,y+8,22,6,2); g.fill(); g.fillStyle='#a8743c'; rr(g,x+4,y+2,24,8,3); g.fill(); }
     else { g.fillStyle='#a8743c'; g.beginPath(); g.moveTo(x+4,y+14); g.quadraticCurveTo(x+16,y+4,x+28,y+14); g.closePath(); g.fill(); g.fillStyle='#ffe08a'; circ(g,x+16,y+18,2.2); g.fill(); if(Math.random()<0.03) addPart({x:x+rand(6,26),y:y+rand(8,20),vx:0,vy:-10,life:0.7,col:'#fff2b0',size:2,type:'spark'}); } break; }
   case 'M': { if(S.flames>=3){ g.fillStyle='rgba(200,160,255,.08)'; g.fillRect(x,y,TS,TS); break; } const gr=g.createLinearGradient(x,y,x,y+TS); gr.addColorStop(0,'rgba(180,120,255,.85)'); gr.addColorStop(1,'rgba(90,40,160,.85)'); g.fillStyle=gr; g.fillRect(x,y,TS,TS);
     g.strokeStyle='rgba(255,230,255,.6)'; g.lineWidth=1; for(let i=0;i<3;i++){ g.beginPath(); const o=(T*20+i*11)%TS; g.moveTo(x,y+o); g.lineTo(x+TS,y+o-6); g.stroke(); }
     for(let i=0;i<3;i++){ const lit=i<S.flames; g.fillStyle=lit?['#8dff7a','#5fe0ff','#fff1a0'][i]:'#2a1d3a'; circ(g,x+8+i*8,y+16,3); g.fill(); } break; }
   case '[': case ']': { const up=(c==='['&&room.crystal===0)||(c===']'&&room.crystal===1); const col=c==='['?['#ff9a3c','#ffd08a','#a3501a']:['#3c8cff','#9cc8ff','#1a3f8a'];
     if(up){ g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x+2,y+24,TS-4,6); g.fillStyle=col[2]; rr(g,x+2,y+6,TS-4,TS-6,4); g.fill(); g.fillStyle=col[0]; rr(g,x+2,y+2,TS-4,TS-10,4); g.fill(); g.fillStyle=col[1]; g.globalAlpha=0.8; g.beginPath(); g.moveTo(x+6,y+6); g.lineTo(x+12,y+6); g.lineTo(x+6,y+14); g.fill(); g.globalAlpha=1; }
     else { g.strokeStyle=col[0]; g.globalAlpha=0.6; g.lineWidth=2; rr(g,x+4,y+4,TS-8,TS-8,4); g.stroke(); g.globalAlpha=1; } break; }
   case 'l': { const lit=lampLit(tx,ty); g.fillStyle='rgba(0,0,0,.3)'; ell(g,x+16,y+28,6,2.5); g.fill(); g.fillStyle='#3a3540'; g.fillRect(x+14,y+2,4,26); g.fillRect(x+11,y+26,10,3); g.fillStyle='#2a2530'; rr(g,x+9,y-8,14,12,3); g.fill();
     g.fillStyle=lit?'#ffe9a0':'#4a4458'; rr(g,x+11,y-6,10,8,2); g.fill(); if(lit){ g.fillStyle='rgba(255,220,120,.25)'; circ(g,x+16,y-2,12); g.fill(); } break; }
  }
 }
 // blocchi spingibili
 for(const b of room.blocks){ const x=b.x*TS+b.ox, y=b.y*TS+b.oy; g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x+3,y+26,TS-4,5); g.fillStyle=th.wall; rr(g,x+1,y+4,TS-2,TS-4,3); g.fill(); g.fillStyle=th.wallTop; rr(g,x+1,y+1,TS-2,TS-8,3); g.fill(); g.strokeStyle=th.acc; g.globalAlpha=0.5; g.lineWidth=1.5; rr(g,x+8,y+5,TS-16,TS-18,2); g.stroke(); g.globalAlpha=1; }
}
function lampLit(tx,ty){ if(room.key==='ow:1,2'){ const order={'5,2':6,'10,2':12,'3,7':18,'12,7':24}; return S.fireflies>=(order[tx+','+ty]||99); } return room.key==='ow:3,1'?false:true; }
function drawGreatLantern(g,cx,by){
 const lvl=S.flames, gl=lvl/3;
 g.fillStyle='rgba(0,0,0,.3)'; ell(g,cx,by+10,26,8); g.fill();
 g.fillStyle='#6f6a74'; rr(g,cx-24,by-6,48,16,4); g.fill(); g.fillStyle='#8e8994'; rr(g,cx-20,by-12,40,10,3); g.fill();
 g.fillStyle='#3b3540'; g.fillRect(cx-4,by-34,8,24);
 const top=by-62; g.fillStyle='#2e2833'; g.beginPath(); g.moveTo(cx-16,top+30); g.lineTo(cx-18,top); g.lineTo(cx+18,top); g.lineTo(cx+16,top+30); g.closePath(); g.fill();
 const gr=g.createLinearGradient(0,top,0,top+30); gr.addColorStop(0,`rgba(255,${200+gl*40},${120+gl*60},${0.15+gl*0.8})`); gr.addColorStop(1,`rgba(255,150,60,${0.1+gl*0.7})`); g.fillStyle=gr; g.fillRect(cx-14,top+3,28,25);
 if(lvl>0){ const f=Math.sin(T*9)*2; g.fillStyle='#fff7d6'; g.beginPath(); g.moveTo(cx-6,top+24); g.quadraticCurveTo(cx-6+f,top+8,cx,top+4+f); g.quadraticCurveTo(cx+6-f,top+8,cx+6,top+24); g.fill(); }
 g.strokeStyle='#1f1b24'; g.lineWidth=2; g.beginPath(); g.moveTo(cx,top+3); g.lineTo(cx,top+28); g.stroke();
 g.fillStyle='#2e2833'; g.beginPath(); g.moveTo(cx-22,top+2); g.lineTo(cx,top-14); g.lineTo(cx+22,top+2); g.closePath(); g.fill(); g.fillStyle='#d9b45a'; circ(g,cx,top-16,3); g.fill();
 for(let i=0;i<3;i++){ g.fillStyle=i<lvl?['#8dff7a','#5fe0ff','#fff1a0'][i]:'#3b3540'; circ(g,cx-12+i*12,by-4,3); g.fill(); }
}
