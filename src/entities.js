// ===================== ENTITÀ =====================
let ents=[], projs=[], parts=[], rings=[], floaters=[];
let P=null, pip=null;
let mode='title', T=0, shake=0, hitstop=0, banner=null, dlg=null, trans=null, fade=null, deadT=0, roomEntry=null, bossRef=null;

function addPart(p){ if(parts.length>500) parts.shift(); p.max=p.life; parts.push(p); }
function burst(x,y,cols,n=12,sp=120,size=3,type='dot',g=0){ for(let i=0;i<n;i++){ const a=rand(0,6.28), s=rand(sp*0.3,sp); addPart({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(0.35,0.8),col:pick(cols),size:rand(size*0.6,size*1.3),type,g}); } }
function floatText(x,y,text,col='#fff'){ for(const f of floaters) if(Math.abs(f.y-y)<18&&f.life>0.4) y=f.y-18; floaters.push({x,y,text,col,life:1.6}); }
function drawShell(g,x,y,s,blue){ g.save(); g.translate(x,y); g.scale(s,s);
 const main=blue?'#7cc4ff':'#ff9fb2', dark=blue?'#2f6fb5':'#b84a6a', lite=blue?'#d8f0ff':'#ffe2e8';
 g.beginPath(); rr(g,-4.5,4,9,3.5,1.2); g.fillStyle=dark; g.fill(); g.strokeStyle='#2a1020'; g.lineWidth=1; g.stroke();
 const cy=5, R=8.5, n=6, a0=-Math.PI*0.93, a1=-Math.PI*0.07; g.beginPath(); g.moveTo(-2.4,5.5);
 for(let i=0;i<=n;i++){ const a=a0+(a1-a0)*i/n; const px=Math.cos(a)*R, py=cy+Math.sin(a)*R; if(i===0) g.lineTo(px,py); else { const am=a0+(a1-a0)*(i-0.5)/n; g.quadraticCurveTo(Math.cos(am)*(R+2.6),cy+Math.sin(am)*(R+2.6),px,py); } }
 g.lineTo(2.4,5.5); g.closePath(); const gr=g.createLinearGradient(0,-5,0,6); gr.addColorStop(0,lite); gr.addColorStop(1,main); g.fillStyle=gr; g.fill(); g.strokeStyle='#2a1020'; g.lineWidth=1.1; g.stroke();
 g.strokeStyle=dark; g.lineWidth=0.9; for(let i=1;i<n;i++){ const a=a0+(a1-a0)*i/n; g.beginPath(); g.moveTo(0,5); g.lineTo(Math.cos(a)*(R-0.5),cy+Math.sin(a)*(R-0.5)); g.stroke(); }
 g.fillStyle='rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-3,-0.5,1.2,2.4,-0.5,0,6.28); g.fill(); g.restore(); }

function mkEnt(kind,x,y,extra){
 const d=EDEF[kind]; const e=Object.assign({kind,x,y,z:0,vx:0,vy:0,t:rand(0,2),hp:d.hp||1,maxhp:d.hp||1,r:d.r||10,inv:0,stun:0,dead:false,enemy:!!d.enemy,kbx:0,kby:0,face:'d',hitId:-1,sq:1},extra||{});
 d.init&&d.init(e); return e;
}
function mkPlayer(x,y){ return {x,y,vx:0,vy:0,face:'d',fx:0,fy:1,walk:0,swing:0,swingId:0,charge:0,charging:false,spin:0,inv:0,kbx:0,kby:0,hook:null,falling:0,bellCd:0,fireCd:0,push:0,hold:null,lastSafe:{x,y},warpCd:0.5,dmgTaken:false,sq:1}; }

// ---------- danni ----------
function hurtPlayer(dmg,fx,fy){
 if(P.inv>0||mode!=='play'||P.falling>0) return;
 S.hp-=dmg; P.inv=1.1; P.dmgTaken=true; P.sqk=0.18; AU.sfx('hurt'); shake=7; hitstop=0.06;
 const a=Math.atan2(P.y-fy,P.x-fx); P.kbx=Math.cos(a)*260; P.kby=Math.sin(a)*260;
 burst(P.x,P.y-12,['#ff6b6b','#ffd1d1'],10,120,3);
 if(S.hp<=0){ S.hp=0; mode='dead'; deadT=0; S.stats.deaths++; AU.sfx('fall'); }
}
function hitEnemy(e,dmg,src){
 if(e.dead||e.inv>0) return false;
 const d=EDEF[e.kind];
 if(d.onHit){ const r=d.onHit(e,dmg,src); if(r==='block'){ if(e.lastClang!==src.id){ e.lastClang=src.id; AU.sfx('clang'); burst((e.x+src.x)/2,(e.y+src.y)/2-10,['#fff','#ffe08a'],8,140,2,'spark'); if(src.type==='sword'||src.type==='spin'){ const a=Math.atan2(P.y-e.y,P.x-e.x); P.kbx=Math.cos(a)*170; P.kby=Math.sin(a)*170; } } return false; } if(r==='ignore') return false; if(typeof r==='number') dmg=r; }
 e.hp-=dmg; e.inv=d.invT||0.3; AU.sfx('hit'); hitstop=Math.max(hitstop,0.05); shake=Math.max(shake,e.boss?5:2);
 if(!e.boss&&!d.noKb){ const a=Math.atan2(e.y-src.y,e.x-src.x); e.kbx=Math.cos(a)*230; e.kby=Math.sin(a)*230; }
 burst(e.x,e.y-10-e.z,['#fff',d.col||'#ffd27a'],8,130,2.5); addPart({x:e.x,y:e.y-10-e.z,vx:0,vy:0,life:0.6,col:d.col||'#ffd27a',size:9,type:'splat'});
 if(e.hp<=0) killEnemy(e);
 return true;
}
function killEnemy(e){
 const d=EDEF[e.kind]; e.dead=true; AU.sfx('kill'); S.stats.kills++;
 burst(e.x,e.y-10,[d.col||'#c8a0ff','#ffffff','#5b4a6b'],22,170,3.5);
 for(let i=0;i<8;i++) addPart({x:e.x+rand(-8,8),y:e.y-8,vx:rand(-20,20),vy:rand(-40,-10),life:1,col:'rgba(200,190,220,.5)',size:rand(5,9),type:'smoke'});
 for(let i=0;i<4;i++) addPart({x:e.x+rand(-12,12),y:e.y-8+rand(-10,6),vx:0,vy:0,life:rand(0.8,1.3),col:d.col||'#c8a0ff',size:rand(7,13),type:'splat'});
 d.onDeath&&d.onDeath(e);
 if(!e.boss&&!d.noDrop){ const r=Math.random(); if(r<0.42) ents.push(mkEnt('shell',e.x,e.y,{val:Math.random()<0.15?5:1})); else if(r<0.62&&S.hp<S.maxhp) ents.push(mkEnt('heart',e.x,e.y)); }
}
function stunEnemy(e,t){ const d=EDEF[e.kind]; if(d.onStun) return d.onStun(e,t); if(e.boss) return; e.stun=Math.max(e.stun,t); burst(e.x,e.y-14,['#bfe6ff','#fff'],6,60,2,'spark'); }
function toward(e,tx,ty,s){ const a=Math.atan2(ty-e.y,tx-e.x); e.vx=Math.cos(a)*s; e.vy=Math.sin(a)*s; return a; }
function faceOf(dx,dy){ return Math.abs(dx)>Math.abs(dy)?(dx>0?'r':'l'):(dy>0?'d':'u'); }
const FV={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]};

// ---------- definizioni ----------
const EDEF={
 // ---------- nemici ----------
 muffolo:{enemy:1,hp:2,r:10,col:'#9be07a',
  init(e){ e.hop=rand(0.3,1.2); e.vz=0; if(e.small){e.hp=e.maxhp=1;e.r=7;} },
  update(e,dt){
   if(e.stun>0){ e.vx=e.vy=0; return; }
   if(e.z>0||e.vz>0){ e.vz-=520*dt; e.z+=e.vz*dt; moveBox(e,e.vx*dt,e.vy*dt,solidE,e.r-2,e.r-2,2); if(e.z<=0){ e.z=0; e.vz=0; e.sq=0.6; e.vx=e.vy=0; } }
   else { e.hop-=dt; if(e.hop<=0){ e.hop=rand(0.5,1.2); e.vz=170; e.z=0.1; const dd=dist(e.x,e.y,P.x,P.y); if(dd<190) toward(e,P.x,P.y,e.small?90:70); else { const a=rand(0,6.28); e.vx=Math.cos(a)*50; e.vy=Math.sin(a)*50; } e.sq=1.3; } }
   e.sq=lerp(e.sq,1,dt*8);
  },
  onDeath(e){ if(!e.small){ for(const s of [-1,1]){ const m=mkEnt('muffolo',e.x+s*8,e.y,{small:true}); m.hp=m.maxhp=1; m.r=7; m.inv=0.3; ents.push(m);} } },
  draw(g,e){ const s=e.small?0.65:1, sq=e.sq; g.save(); g.translate(e.x,e.y-e.z); g.scale(s*(2-sq),s*sq);
   g.fillStyle='#5f8a3e'; g.beginPath(); g.moveTo(-12,0); g.quadraticCurveTo(-14,-18,0,-20); g.quadraticCurveTo(14,-18,12,0); g.closePath(); g.fill();
   g.fillStyle='#86b85a'; g.beginPath(); g.ellipse(-3,-13,7,5,-0.4,0,6.28); g.fill();
   g.fillStyle='#c49be0'; circ(g,6,-14,2.5); g.fill(); circ(g,-7,-6,2); g.fill(); circ(g,3,-5,1.6); g.fill();
   const lx=clamp((P.x-e.x)/60,-2,2); g.fillStyle='#fff'; circ(g,-4+lx,-11,3.2); g.fill(); circ(g,4+lx,-11,3.2); g.fill(); g.fillStyle='#1b1020'; circ(g,-4+lx*1.5,-11,1.6); g.fill(); circ(g,4+lx*1.5,-11,1.6); g.fill();
   g.restore(); }
 },
 svolazzo:{enemy:1,hp:1,r:9,col:'#d9d2e8',fly:1,
  init(e){ e.z=14; e.ret=0; },
  update(e,dt){
   if(e.stun>0){ e.z=lerp(e.z,2,dt*5); return; } e.z=lerp(e.z,14+Math.sin(e.t*4)*4,dt*4);
   let tx=P.x, ty=P.y-6; const f=projs.find(p=>p.k==='fire'); if(f){ tx=f.x; ty=f.y; }
   const a=Math.atan2(ty-e.y,tx-e.x)+(e.ret>0?Math.PI:0); e.ret-=dt;
   const sp=e.ret>0?90:65, w=Math.sin(e.t*5)*60;
   e.vx=lerp(e.vx,Math.cos(a)*sp-Math.sin(a)*w,dt*3); e.vy=lerp(e.vy,Math.sin(a)*sp+Math.cos(a)*w,dt*3);
   moveBox(e,e.vx*dt,e.vy*dt,solidF,6,6,2);
   if(dist(e.x,e.y,P.x,P.y)<20) e.ret=0.9;
  },
  draw(g,e){ const fl=Math.sin(e.t*26)*0.8; g.save(); g.translate(e.x,e.y-e.z);
   g.fillStyle='#8f86a3'; for(const s of [-1,1]){ g.save(); g.scale(s,1); g.rotate(fl*0.5); g.beginPath(); g.moveTo(0,-2); g.quadraticCurveTo(14,-14,18,-2); g.quadraticCurveTo(12,4,0,2); g.fill(); g.fillStyle='#c4bad6'; circ(g,10,-5,2.5); g.fill(); g.fillStyle='#8f86a3'; g.restore(); }
   g.fillStyle='#5b5270'; g.beginPath(); g.ellipse(0,0,4,7,0,0,6.28); g.fill(); g.fillStyle='#ff6b9a'; circ(g,-2,-3,1.4); g.fill(); circ(g,2,-3,1.4); g.fill();
   g.strokeStyle='#5b5270'; g.lineWidth=1; g.beginPath(); g.moveTo(-1,-6); g.quadraticCurveTo(-4,-12,-6,-12); g.moveTo(1,-6); g.quadraticCurveTo(4,-12,6,-12); g.stroke(); g.restore(); }
 },
 guardia:{enemy:1,hp:4,r:12,col:'#ff9a4a',
  init(e){ e.face=pick(['l','r','u','d']); e.state='walk'; e.st=rand(1,2.5); },
  onHit(e,dmg,src){ if(e.stun>0) return; if(src.type==='bell'||src.type==='hook') return 'ignore'; const [fx,fy]=FV[e.face]; const a=Math.atan2(src.y-e.y,src.x-e.x); if(Math.cos(a)*fx+Math.sin(a)*fy>0.45) return 'block'; },
  update(e,dt){
   if(e.stun>0){ e.vx=e.vy=0; return; }
   e.st-=dt; const [fx,fy]=FV[e.face];
   if(e.state==='walk'){ const r=moveBox(e,fx*40*dt,fy*40*dt,solidE,10,8,3); if(r.hitX||r.hitY||e.st<=0){ e.face=pick(['l','r','u','d']); e.st=rand(1,2.5); }
     const dx=P.x-e.x, dy=P.y-e.y; if((Math.abs(dx)<14||Math.abs(dy)<14)&&Math.hypot(dx,dy)<200){ e.face=faceOf(dx,dy); e.state='wind'; e.st=0.45; } }
   else if(e.state==='wind'){ if(e.st<=0){ e.state='charge'; e.st=1.4; } }
   else if(e.state==='charge'){ const r=moveBox(e,fx*165*dt,fy*165*dt,solidE,10,8,3); if(Math.random()<0.4) addPart({x:e.x+rand(-6,6),y:e.y,vx:0,vy:-10,life:0.4,col:'rgba(120,110,110,.6)',size:4,type:'smoke'}); if(r.hitX||r.hitY||e.st<=0){ e.state='rest'; e.st=0.8; if(r.hitX||r.hitY){shake=3;AU.sfx('push');} } }
   else if(e.state==='rest'){ if(e.st<=0){ e.state='walk'; e.st=rand(1,2); } }
  },
  draw(g,e){ const [fx,fy]=FV[e.face]; const bob=e.state==='charge'?Math.sin(e.t*30)*1.5:Math.sin(e.t*8)*1; g.save(); g.translate(e.x,e.y); if(e.state==='wind') g.translate(rand(-1,1),0);
   const drawShield=()=>{ g.save(); g.translate(fx*11,-12+fy*6); g.fillStyle='#6a5d55'; rr(g,-7,-9,14,18,5); g.fill(); g.strokeStyle='#ff9a4a'; g.lineWidth=1.5; g.beginPath(); g.moveTo(0,-6); g.lineTo(0,6); g.moveTo(-4,0); g.lineTo(4,0); g.stroke(); g.restore(); };
   if(fy<0) drawShield();
   g.fillStyle='#2f2b2e'; g.fillRect(-7,-6+bob,5,7); g.fillRect(2,-6-bob,5,7);
   g.fillStyle='#4a4448'; rr(g,-10,-22,20,18,5); g.fill(); g.fillStyle='#5f585c'; rr(g,-8,-21,16,6,3); g.fill();
   g.fillStyle='#3b3639'; rr(g,-9,-36,18,16,6); g.fill(); g.fillStyle=e.stun>0?'#7fd0ff':(e.state==='wind'||e.state==='charge'?'#ffdf6b':'#ff7a2b'); if(fy>=0) g.fillRect(-6+fx*3,-29,12,2.5); else g.fillRect(-6,-34,0,0);
   g.fillStyle='#ff7a2b'; g.beginPath(); g.moveTo(0,-36); g.lineTo(-3,-44); g.lineTo(3,-40); g.fill();
   if(fy>=0) drawShield();
   if(e.stun>0){ for(let i=0;i<3;i++){ const a=e.t*5+i*2.1; g.fillStyle='#fff3a0'; circ(g,Math.cos(a)*10,-46+Math.sin(a)*3,2); g.fill(); } }
   g.restore(); }
 },
 sputa:{enemy:1,hp:3,r:12,col:'#e07ad6',noKb:1,
  init(e){ e.cd=rand(1,2.2); e.puff=0; },
  update(e,dt){ if(e.stun>0) return; e.cd-=dt; e.puff=Math.max(0,e.puff-dt*3);
   if(e.cd<=0&&dist(e.x,e.y,P.x,P.y)<260){ e.cd=2.1; e.puff=1; const a=Math.atan2(P.y-6-(e.y-14),P.x-e.x); projs.push({k:'spore',x:e.x+Math.cos(a)*12,y:e.y-14+Math.sin(a)*12,vx:Math.cos(a)*120,vy:Math.sin(a)*120,life:3,hostile:1,dmg:1}); AU.tone(220,0.15,'sine',0.06,0.5); } },
  draw(g,e){ const a=Math.atan2(P.y-e.y,P.x-e.x), p=e.puff; g.save(); g.translate(e.x,e.y);
   g.fillStyle='#3e6a33'; for(let i=0;i<4;i++){ g.save(); g.rotate(i*1.57+0.4); g.beginPath(); g.ellipse(9,0,9,4,0,0,6.28); g.fill(); g.restore(); }
   g.fillStyle='#8a3d82'; g.beginPath(); g.ellipse(0,-12,11+p*2,11-p*2,0,0,6.28); g.fill(); g.fillStyle='#b25aa8'; circ(g,-4,-16,4); g.fill();
   g.fillStyle='#e7a6e0'; circ(g,5,-8,1.8); g.fill(); circ(g,-6,-6,1.4); g.fill();
   g.fillStyle='#2a0f28'; g.beginPath(); g.ellipse(Math.cos(a)*6,-12+Math.sin(a)*5,4+p*2,3+p*2,a,0,6.28); g.fill(); g.restore(); }
 },
 granchio:{enemy:1,hp:2,r:11,col:'#ff9a5a',
  init(e){ e.state='rest'; e.st=rand(0.5,1.2); e.dir=1; },
  onHit(e,dmg,src){ if(e.stun>0) return; if(e.state==='dash') return 'block'; },
  update(e,dt){ if(e.stun>0) return; e.st-=dt;
   if(e.state==='rest'){ if(e.st<=0){ e.state='dash'; e.st=rand(0.45,0.7); e.dir=Math.sign(P.x-e.x)||1; if(Math.random()<0.25) e.dir*=-1; } }
   else { const r=moveBox(e,e.dir*175*dt,(P.y>e.y?1:-1)*20*dt,solidE,9,7,3); if(Math.random()<0.5) addPart({x:e.x,y:e.y,vx:-e.dir*30,vy:-10,life:0.35,col:'rgba(230,210,160,.7)',size:3,type:'smoke'}); if(e.st<=0||r.hitX){ e.state='rest'; e.st=rand(0.8,1.3); } } },
  draw(g,e){ const op=e.state==='rest'?1:0, w=Math.sin(e.t*(e.state==='dash'?30:5)); g.save(); g.translate(e.x,e.y);
   g.strokeStyle='#a14a26'; g.lineWidth=2; for(const s of [-1,1]) for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(s*6,-6+i*2); g.lineTo(s*13,-3+i*3+w*s*1.5); g.stroke(); }
   for(const s of [-1,1]){ g.save(); g.translate(s*13,-14); g.rotate(s*(-0.3-op*0.4)); g.fillStyle='#d8682f'; g.beginPath(); g.ellipse(0,0,6,4.5,0,0,6.28); g.fill(); g.fillStyle='#f0a067'; g.beginPath(); g.moveTo(2*s,-1); g.lineTo(7*s,-4-op*3); g.lineTo(6*s,1); g.fill(); g.restore(); }
   g.fillStyle='#c8582a'; g.beginPath(); g.ellipse(0,-9,11,8,0,0,6.28); g.fill(); g.fillStyle='#e8874f'; g.beginPath(); g.ellipse(-2,-12,6,3,0,0,6.28); g.fill();
   g.strokeStyle='#7a3218'; g.lineWidth=1.5; g.beginPath(); g.moveTo(-3,-15); g.lineTo(-4,-21); g.moveTo(3,-15); g.lineTo(4,-21); g.stroke(); g.fillStyle='#111'; circ(g,-4,-21,2); g.fill(); circ(g,4,-21,2); g.fill(); g.restore(); }
 },
 velo:{enemy:1,hp:2,r:11,col:'#e9f2ff',fly:1,
  init(e){ e.vis=0; e.rev=0; },
  onHit(e,dmg,src){ if(e.vis<0.5&&src.type!=='fire') return 'ignore'; if(src.type==='fire'){ e.rev=3; return 2; } },
  harm(e){ return e.vis>0.5&&e.stun<=0; },
  update(e,dt){ e.rev-=dt; const near=S.items.lanterna&&dist(e.x,e.y,P.x,P.y)<95;
   const base=Math.pow(Math.max(0,Math.sin(e.t*1.1)),10);
   e.vis=lerp(e.vis,(near||e.rev>0)?1:Math.max(0.07,base),dt*5);
   if(e.stun>0) return; const a=toward(e,P.x,P.y-8,38); e.x+=e.vx*dt+Math.cos(e.t*2)*0.3; e.y+=e.vy*dt+Math.sin(e.t*3)*0.4; e.z=10+Math.sin(e.t*2.4)*4;
   e.x=clamp(e.x,10,VW-10); e.y=clamp(e.y,16,VH-6); },
  draw(g,e){ g.save(); g.globalAlpha=clamp(e.vis,0,1); g.translate(e.x,e.y-e.z);
   g.fillStyle='rgba(230,240,255,.92)'; g.beginPath(); g.moveTo(-11,4); g.quadraticCurveTo(-13,-24,0,-26); g.quadraticCurveTo(13,-24,11,4);
   for(let i=0;i<4;i++){ g.quadraticCurveTo(11-i*5.5-2.75,8+Math.sin(e.t*6+i)*3,11-(i+1)*5.5,4); } g.fill();
   g.fillStyle='#1d2440'; g.beginPath(); g.ellipse(-4,-14,2.5,3.5,0,0,6.28); g.fill(); g.beginPath(); g.ellipse(4,-14,2.5,3.5,0,0,6.28); g.fill(); g.beginPath(); g.ellipse(0,-7,2.5,1.8+Math.sin(e.t*3),0,0,6.28); g.fill();
   g.restore(); g.globalAlpha=1; }
 },
 scarabeo:{enemy:1,hp:2,r:11,col:'#6fa8ff',
  init(e){ e.dir=pick(['l','r','u','d']); e.flip=0; e.rot=0; },
  onHit(e,dmg,src){ if(e.flip<=0) return 'block'; },
  onStun(e,t){ e.flip=3.5; e.vx=e.vy=0; burst(e.x,e.y-10,['#bfe6ff','#fff'],8,80,2,'spark'); },
  harm(e){ return e.flip<=0; },
  update(e,dt){ if(e.flip>0){ e.flip-=dt; return; } const [fx,fy]=FV[e.dir]; const r=moveBox(e,fx*130*dt,fy*130*dt,solidE,9,8,3); e.rot+=dt*12;
   if(r.hitX||r.hitY){ AU.tone(160,0.08,'square',0.05); shake=Math.max(shake,1.5); const dx=P.x-e.x, dy=P.y-e.y; const opts=['l','r','u','d'].filter(d=>d!==e.dir); e.dir=Math.random()<0.6?faceOf(dx,dy):pick(opts); if(e.dir===r.dir) e.dir=pick(opts); } },
  draw(g,e){ g.save(); g.translate(e.x,e.y);
   if(e.flip>0){ g.fillStyle='#2b3d66'; g.beginPath(); g.ellipse(0,-9,12,9,0,0,6.28); g.fill(); g.strokeStyle='#1a2440'; g.lineWidth=2; for(let i=0;i<3;i++){ const w=Math.sin(e.t*25+i)*3; g.beginPath(); g.moveTo(-6+i*6,-14); g.lineTo(-8+i*7+w,-22); g.stroke(); } g.fillStyle='#9fb8e8'; g.beginPath(); g.ellipse(0,-11,8,5,0,0,6.28); g.fill(); }
   else { g.fillStyle='rgba(0,0,0,.25)'; ell(g,0,0,11,4); g.fill(); g.fillStyle='#2f4f9a'; circ(g,0,-11,11); g.fill(); g.strokeStyle='#8fc0ff'; g.lineWidth=2; const k=e.rot; for(let i=0;i<3;i++){ const o=((k*4+i*7)%21)-10; g.beginPath(); g.moveTo(o,-21); g.quadraticCurveTo(o+3,-11,o,-1); g.stroke(); } g.fillStyle='rgba(255,255,255,.4)'; circ(g,-4,-16,3); g.fill(); }
   g.restore(); }
 },
 // ---------- boss ----------
 muffa:{enemy:1,hp:6,r:26,col:'#d08cff',boss:1,noKb:1,invT:0.5,name:'MADRE MUFFA',sub:'Regina delle Spore',
  init(e){ e.boss=true; e.burn=0; e.cd=1.5; e.sum=4; e.hinted=0; },
  onHit(e,dmg,src){ if(src.type==='fire'){ if(e.burn<=0){ e.burn=4.5; AU.sfx('burn'); burst(e.x,e.y-40,['#ff8a3c','#ffe08a'],20,150,3,'ember'); } return 'ignore'; } if(e.burn<=0){ if(!e.hinted){e.hinted=1; pipSay('La cappella è troppo dura! Prova con il fuoco!');} return 'block'; } return 1; },
  update(e,dt){ e.burn-=dt; e.cd-=dt; e.sum-=dt; e.x=8*TS+Math.sin(e.t*0.6)*90; e.y=3.8*TS;
   if(e.cd<=0){ e.cd=e.burn>0?2.4:1.6; const n=5, base=Math.atan2(P.y-e.y,P.x-e.x); for(let i=0;i<n;i++){ const a=base+(i-2)*0.28; projs.push({k:'spore',x:e.x,y:e.y-20,vx:Math.cos(a)*120,vy:Math.sin(a)*120,life:3,hostile:1,dmg:1}); } AU.tone(180,0.3,'sine',0.08,0.5); }
   if(e.sum<=0){ e.sum=6; if(ents.filter(x=>x.kind==='muffolo').length<3){ for(const s of [-1,1]){ const m=mkEnt('muffolo',e.x+s*30,e.y+20,{small:true}); m.hp=m.maxhp=1; m.r=7; ents.push(m);} burst(e.x,e.y,['#9be07a','#c49be0'],16,120); } } },
  draw(g,e){ const b=e.burn>0, br=Math.sin(e.t*3)*2; g.save(); g.translate(e.x,e.y);
   g.fillStyle='rgba(0,0,0,.3)'; ell(g,0,4,34,10); g.fill();
   g.fillStyle='#efe3c9'; rr(g,-14,-34,28,36,10); g.fill(); g.fillStyle='#d8c9a8'; g.fillRect(-14,-10,28,4);
   g.fillStyle='#2a1a2e'; circ(g,-6,-20,3); g.fill(); circ(g,6,-20,3); g.fill(); g.beginPath(); g.ellipse(0,-10,5,3+Math.abs(br),0,0,6.28); g.fill();
   if(b){ const gr=g.createRadialGradient(0,-22,2,0,-22,22); gr.addColorStop(0,'rgba(255,240,170,.95)'); gr.addColorStop(1,'rgba(255,120,40,0)'); g.fillStyle=gr; circ(g,0,-22,22); g.fill(); }
   const cy=b?-34:-38-br; g.fillStyle=b?'#5a2a22':'#8a3db0'; g.beginPath(); g.ellipse(0,cy,b?34:46,b?14:26,0,Math.PI,0); g.fill(); g.fillRect(-(b?34:46),cy-1,(b?68:92),4);
   if(!b){ g.fillStyle='#c48af0'; circ(g,-20,cy-12,7); g.fill(); circ(g,14,cy-16,9); g.fill(); circ(g,30,cy-6,5); g.fill(); circ(g,-34,cy-4,4); g.fill(); }
   else { for(let i=0;i<4;i++){ g.fillStyle=pick(['#ff8a3c','#ffd27a']); circ(g,rand(-30,30),cy-rand(0,12),rand(2,4)); g.fill(); } if(Math.random()<0.5) addPart({x:e.x+rand(-30,30),y:e.y+cy,vx:0,vy:-40,life:0.7,col:'#ff9a3c',size:2,type:'ember'}); }
   g.restore(); }
 },
 anguilla:{enemy:1,hp:6,r:16,col:'#ffb36b',boss:1,noKb:1,invT:0.45,name:'ANGUILLA DI RAME',sub:'Terrore del Faro',
  init(e){ e.boss=true; e.state='under'; e.st=1.5; e.cd=0; e.rip={x:e.x,y:e.y}; },
  onHit(e,dmg,src){ if(e.state==='flop') return 1; if(e.state==='up'&&src.type==='sword') return 'block'; return 'ignore'; },
  onHook(e){ if(e.state!=='up') return false; e.state='pulled'; e.st=0.4; const a=Math.atan2(P.y-e.y,P.x-e.x); let best=null,bd=1e9; for(let ty=1;ty<CH-1;ty++) for(let tx=1;tx<CW-1;tx++){ if(tileAt(tx,ty)!=='_') continue; const cx=tx*TS+16,cy=ty*TS+22; const d=dist(cx,cy,e.x+Math.cos(a)*50,e.y+Math.sin(a)*50); if(d<bd){bd=d;best={x:cx,y:cy};} } e.to=best; AU.sfx('hook'); return true; },
  harm(e){ return e.state==='up'; },
  update(e,dt){ e.st-=dt;
   if(e.state==='under'){ if(Math.random()<0.3) addPart({x:e.rip.x+rand(-8,8),y:e.rip.y+rand(-4,4),vx:0,vy:-8,life:0.5,col:'rgba(200,240,255,.6)',size:3,type:'bubble'});
     e.rip.x=lerp(e.rip.x,P.x,dt*0.6); e.rip.y=clamp(lerp(e.rip.y,P.y,dt*0.6),2.5*TS,7.5*TS); e.rip.x=clamp(e.rip.x,3.5*TS,12.5*TS);
     if(e.st<=0){ const c=[]; for(let ty=2;ty<=7;ty++) for(let tx=3;tx<=12;tx++){ if(tileAt(tx,ty)==='W'&&['_'].includes(tileAt(tx+1,ty))||tileAt(tx-1,ty)==='_'||tileAt(tx,ty+1)==='_'||tileAt(tx,ty-1)==='_') if(tileAt(tx,ty)==='W') c.push([tx,ty]); }
       const [tx,ty]=c.sort((a,b)=>dist(a[0]*TS,a[1]*TS,P.x,P.y)-dist(b[0]*TS,b[1]*TS,P.x,P.y))[(Math.random()*Math.min(4,c.length))|0];
       e.x=tx*TS+16; e.y=ty*TS+24; e.state='up'; e.st=2.6; e.cd=0.6; AU.sfx('bubble'); burst(e.x,e.y-8,['#cfefff','#ffffff'],14,120,3,'bubble'); } }
   else if(e.state==='up'){ e.cd-=dt; if(e.cd<=0){ e.cd=0.75; const a=Math.atan2(P.y-6-e.y+20,P.x-e.x); projs.push({k:'bubble',x:e.x,y:e.y-26,vx:Math.cos(a)*140,vy:Math.sin(a)*140,life:3,hostile:1,dmg:1}); AU.sfx('bubble'); } if(e.st<=0){ e.state='under'; e.st=rand(1.2,2); e.rip={x:e.x,y:e.y}; burst(e.x,e.y-6,['#cfefff'],10,80,3,'bubble'); } }
   else if(e.state==='pulled'){ if(e.to){ e.x=lerp(e.x,e.to.x,dt*10); e.y=lerp(e.y,e.to.y,dt*10); } if(e.st<=0){ e.state='flop'; e.st=3.2; shake=6; AU.tone(90,0.3,'sine',0.2,0.5); } }
   else if(e.state==='flop'){ if(e.st<=0){ e.state='under'; e.st=1.5; e.rip={x:e.x,y:e.y}; burst(e.x,e.y,['#cfefff'],14,100,3,'bubble'); } } },
  draw(g,e){ if(e.state==='under'){ g.strokeStyle='rgba(220,250,255,.5)'; g.lineWidth=2; for(let i=0;i<2;i++){ const r=8+((e.t*20+i*10)%20); g.globalAlpha=1-r/28; ell(g,e.rip.x,e.rip.y,r,r*0.4); g.stroke(); } g.globalAlpha=1; return; }
   g.save(); g.translate(e.x,e.y); const fl=e.state==='flop', w=Math.sin(e.t*(fl?18:4));
   if(fl){ g.rotate(w*0.25); for(let i=5;i>=0;i--){ g.fillStyle=i%2?'#b8682f':'#d9853f'; circ(g,-i*8,-6+Math.sin(e.t*14+i)*3,10-i*0.8); g.fill(); } }
   else { g.fillStyle='rgba(20,60,80,.5)'; ell(g,0,0,18,6); g.fill(); for(let i=3;i>=0;i--){ g.fillStyle=i%2?'#b8682f':'#d9853f'; circ(g,w*i*2,-6-i*7,11-i); g.fill(); } }
   const hy=fl?-8:-34; g.fillStyle='#e0904a'; g.beginPath(); g.ellipse(0,hy,13,11,0,0,6.28); g.fill(); g.fillStyle='#f6c08a'; g.beginPath(); g.ellipse(0,hy+4,8,5,0,0,6.28); g.fill();
   g.fillStyle='#fff'; circ(g,-5,hy-3,3.5); g.fill(); circ(g,5,hy-3,3.5); g.fill(); g.fillStyle='#000'; circ(g,-5,hy-3,1.6); g.fill(); circ(g,5,hy-3,1.6); g.fill();
   g.strokeStyle='#7a4220'; g.lineWidth=2; g.beginPath(); g.moveTo(0,hy-10); g.quadraticCurveTo(10,hy-26,2,hy-30); g.stroke();
   const gl=0.6+Math.sin(e.t*8)*0.4; g.fillStyle=`rgba(255,250,180,${gl})`; circ(g,2,hy-31,4.5); g.fill(); g.restore(); }
 },
 gufo:{enemy:1,hp:6,r:18,col:'#ffd27a',boss:1,noKb:1,fly:1,invT:0.45,name:"GUFO D'OTTONE",sub:'Custode del Campanile',
  init(e){ e.boss=true; e.state='fly'; e.st=3; e.cd=1; e.z=50; e.ang=0; },
  onHit(e,dmg,src){ if(e.state==='down') return src.type==='bell'?'ignore':1; return 'ignore'; },
  onStun(e){ if(e.state==='warn'||e.state==='swoop'){ e.state='down'; e.st=3.6; e.z=0; AU.tone(800,0.5,'square',0.06,0.3); shake=8; burst(e.x,e.y-10,['#ffe08a','#fff'],20,160,3,'spark'); } else pipSay('Suona la campana quando i suoi occhi si accendono!'); },
  harm(e){ return e.state==='swoop'; },
  update(e,dt){ e.st-=dt;
   if(e.state==='fly'){ e.ang+=dt*0.9; e.x=lerp(e.x,8*TS+Math.cos(e.ang)*150,dt*2); e.y=lerp(e.y,5*TS+Math.sin(e.ang*2)*70,dt*2); e.z=lerp(e.z,50,dt*3); e.cd-=dt;
     if(e.cd<=0){ e.cd=1.1; for(const o of [-0.25,0,0.25]){ const a=Math.atan2(P.y-e.y,P.x-e.x)+o; projs.push({k:'feather',x:e.x,y:e.y-e.z,vx:Math.cos(a)*150,vy:Math.sin(a)*150+30,life:3,hostile:1,dmg:1}); } AU.tone(1200,0.1,'triangle',0.05,0.6); }
     if(e.st<=0){ e.state='warn'; e.st=1.3; AU.tone(600,0.8,'square',0.05,1.5); } }
   else if(e.state==='warn'){ e.x=lerp(e.x,P.x,dt*1.5); e.y=lerp(e.y,P.y-40,dt*1.5); if(e.st<=0){ e.state='swoop'; e.st=0.7; e.sx=P.x; e.sy=P.y; } }
   else if(e.state==='swoop'){ e.x=lerp(e.x,e.sx,dt*6); e.y=lerp(e.y,e.sy,dt*6); e.z=lerp(e.z,6,dt*8); if(e.st<=0){ e.state='fly'; e.st=rand(2.5,3.5); } }
   else if(e.state==='down'){ e.z=0; if(e.st<=0){ e.state='fly'; e.st=3; } } },
  draw(g,e){ g.fillStyle='rgba(0,0,0,.3)'; ell(g,e.x,e.y,20-e.z*0.1,7-e.z*0.04); g.fill();
   g.save(); g.translate(e.x,e.y-e.z); const fl=e.state==='down'?0:Math.sin(e.t*(e.state==='swoop'?20:9));
   if(e.state==='down') g.rotate(Math.sin(e.t*10)*0.15);
   for(const s of [-1,1]){ g.save(); g.scale(s,1); g.rotate(-fl*0.5); g.fillStyle='#a5793a'; g.beginPath(); g.moveTo(8,-20); g.quadraticCurveTo(34,-34,40,-10); g.quadraticCurveTo(26,-6,10,-6); g.fill(); g.strokeStyle='#e8c070'; g.lineWidth=1.5; for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(14+i*7,-10); g.lineTo(20+i*7,-24+i*3); g.stroke(); } g.restore(); }
   g.fillStyle='#c79446'; g.beginPath(); g.ellipse(0,-18,16,20,0,0,6.28); g.fill(); g.fillStyle='#e9c47a'; g.beginPath(); g.ellipse(0,-12,10,12,0,0,6.28); g.fill();
   g.strokeStyle='#8a6028'; g.lineWidth=1; for(let i=0;i<3;i++){ g.beginPath(); g.arc(0,-14+i*5,5,0.3,2.8); g.stroke(); }
   const glow=e.state==='warn'||e.state==='swoop'; for(const s of [-1,1]){ g.fillStyle='#5a3d14'; circ(g,s*7,-28,7); g.fill(); g.fillStyle=e.state==='down'?'#888':glow?'#ff4b3a':'#fff3c0'; circ(g,s*7,-28,4.5); g.fill(); if(e.state==='down'){ g.strokeStyle='#333'; g.lineWidth=1.5; g.beginPath(); g.moveTo(s*7-3,-31); g.lineTo(s*7+3,-25); g.moveTo(s*7+3,-31); g.lineTo(s*7-3,-25); g.stroke(); } }
   g.fillStyle='#ffb02e'; g.beginPath(); g.moveTo(-3,-22); g.lineTo(3,-22); g.lineTo(0,-16); g.fill();
   g.fillStyle='#a5793a'; g.beginPath(); g.moveTo(-14,-34); g.lineTo(-10,-44); g.lineTo(-5,-36); g.fill(); g.beginPath(); g.moveTo(14,-34); g.lineTo(10,-44); g.lineTo(5,-36); g.fill();
   if(e.state==='down'){ for(let i=0;i<3;i++){ const a=e.t*5+i*2.1; g.fillStyle='#fff3a0'; circ(g,Math.cos(a)*16,-48+Math.sin(a)*4,2.5); g.fill(); } }
   g.restore(); }
 },
 falena:{enemy:1,hp:9,r:18,col:'#c59bff',boss:1,noKb:1,fly:1,invT:0.5,name:'CENERALE',sub:'Re Falena',
  init(e){ e.boss=true; e.state='hover'; e.st=2; e.cd=1.5; e.z=30; e.ang=0; e.mask=true; e.alpha=1; },
  phase(e){ return e.hp>6?1:e.hp>3?2:3; },
  onHit(e,dmg,src){ const ph=this.phase(e);
   if(e.state==='down') return (src.type==='sword'||src.type==='spin')?1:'ignore';
   if(ph===1&&src.type==='fire'&&e.z<40){ e.state='down'; e.st=3; e.z=0; AU.sfx('burn'); shake=6; burst(e.x,e.y-20,['#ff8a3c','#ffe08a'],24,160,3,'ember'); return 'ignore'; }
   if(ph===2&&src.type==='hook'&&e.state==='low'){ e.state='down'; e.st=3; e.z=0; shake=8; AU.sfx('hook'); return 'ignore'; }
   if(ph===3&&src.type==='bell'){ e.state='down'; e.st=3.2; e.z=0; AU.sfx('shatter'); shake=8; burst(e.x,e.y-30,['#cfe8ff','#fff','#9b7bff'],26,180,3,'glass',300); return 'ignore'; }
   if(src.type==='sword') return 'block'; return 'ignore'; },
  onStun(e){ return this.onHit(e,0,{type:'bell',x:P.x,y:P.y}); },
  onHook(e){ this.onHit(e,0,{type:'hook',x:P.x,y:P.y}); return true; },
  harm(e){ return e.state!=='down'&&e.z<30&&e.alpha>0.5; },
  update(e,dt){ const ph=this.phase(e); e.st-=dt; e.cd-=dt;
   if(e.lastPh!==ph){ if(e.lastPh) { banner={text:ph===2?'Cenerale vola più in alto!':'Cenerale indossa la Maschera di Cristallo!',t:2.2,small:1}; e.state='hover'; e.st=2; shake=10; AU.sfx('boss'); } e.lastPh=ph; }
   if(e.state==='down'){ if(e.st<=0){ e.state='hover'; e.st=2; } e.z=lerp(e.z,0,dt*8); return; }
   if(ph===1){
     if(e.state==='hover'){ e.ang+=dt; e.x=lerp(e.x,8*TS+Math.cos(e.ang)*140,dt*1.8); e.y=lerp(e.y,4.5*TS+Math.sin(e.ang*1.5)*60,dt*1.8); e.z=lerp(e.z,30,dt*3); if(e.st<=0){ e.state='dive'; e.st=0.9; e.sx=P.x; e.sy=P.y; AU.tone(400,0.4,'sawtooth',0.06,2); } }
     else if(e.state==='dive'){ e.x=lerp(e.x,e.sx,dt*4.5); e.y=lerp(e.y,e.sy,dt*4.5); e.z=lerp(e.z,4,dt*6); if(e.st<=0){ e.state='hover'; e.st=rand(1.5,2.4); } }
     if(e.cd<=0){ e.cd=1.8; for(let i=0;i<6;i++){ const a=i*1.047+e.t; projs.push({k:'dust',x:e.x,y:e.y-e.z,vx:Math.cos(a)*90,vy:Math.sin(a)*90,life:2.5,hostile:1,dmg:1}); } }
   } else if(ph===2){
     if(e.state==='hover'||e.state==='dive'){ e.state='high'; e.st=3; }
     if(e.state==='high'){ e.ang+=dt*0.8; e.x=lerp(e.x,8*TS+Math.cos(e.ang)*160,dt*1.5); e.y=lerp(e.y,5*TS+Math.sin(e.ang)*80,dt*1.5); e.z=lerp(e.z,80,dt*3);
       if(e.cd<=0){ e.cd=3.5; if(ents.filter(x=>x.kind==='svolazzo').length<4) for(const s of [-1,1]) ents.push(mkEnt('svolazzo',e.x+s*20,e.y)); }
       if(e.st<=0){ e.state='low'; e.st=1.8; AU.tone(900,0.6,'sawtooth',0.06,0.5); } }
     else if(e.state==='low'){ e.z=lerp(e.z,16,dt*6); if(e.st<=0){ e.state='high'; e.st=rand(2.5,3.5); } }
   } else {
     e.z=lerp(e.z,20,dt*3);
     if(e.state!=='tele') { e.x=lerp(e.x,e.tx||e.x,dt*2); e.y=lerp(e.y,e.ty||e.y,dt*2); }
     if(e.cd<=0){ e.cd=2.2; const n=10; for(let i=0;i<n;i++){ const a=i*6.283/n+e.t*0.7; projs.push({k:'orb',x:e.x,y:e.y-e.z,vx:Math.cos(a)*105,vy:Math.sin(a)*105,life:3.5,hostile:1,dmg:2}); } AU.tone(150,0.4,'sawtooth',0.07,0.4); }
     if(e.st<=0){ e.state='tele'; e.st=0.5; }
     if(e.state==='tele'){ e.alpha=Math.max(0,e.alpha-dt*4); if(e.st<=0){ e.x=rand(3,13)*TS; e.y=rand(3,7)*TS; e.tx=e.x; e.ty=e.y; e.state='hover'; e.st=3.5; } } else e.alpha=Math.min(1,e.alpha+dt*3);
   } },
  draw(g,e){ const ph=this.phase(e); g.fillStyle='rgba(0,0,0,.35)'; ell(g,e.x,e.y,26-e.z*0.12,8-e.z*0.04); g.fill();
   g.save(); g.globalAlpha=e.alpha; g.translate(e.x,e.y-e.z); const fl=e.state==='down'?0.1:Math.sin(e.t*(ph===2?16:10));
   const burnt=e.state==='down'&&ph===1;
   for(const s of [-1,1]){ g.save(); g.scale(s,1); g.rotate(-fl*0.35);
    g.fillStyle=burnt?'#3a2a2a':'#6f6680'; g.beginPath(); g.moveTo(4,-24); g.bezierCurveTo(30,-60,64,-40,52,-14); g.bezierCurveTo(44,-6,20,-10,6,-14); g.fill();
    g.beginPath(); g.moveTo(4,-14); g.bezierCurveTo(30,-8,44,10,30,18); g.bezierCurveTo(18,22,8,6,4,-8); g.fill();
    g.fillStyle='#b9aecb'; g.beginPath(); g.ellipse(32,-30,9,7,0.4,0,6.28); g.fill(); g.fillStyle='#2a2036'; g.beginPath(); g.ellipse(33,-30,4.5,3.5,0.4,0,6.28); g.fill(); g.fillStyle=ph===3?'#9be2ff':'#ffcf6b'; circ(g,34,-31,1.6); g.fill();
    if(burnt){ for(let i=0;i<2;i++){ g.fillStyle='#ff8a3c'; circ(g,rand(10,45),rand(-40,10),2); g.fill(); } }
    g.restore(); }
   g.fillStyle='#4d4360'; g.beginPath(); g.ellipse(0,-14,8,18,0,0,6.28); g.fill(); g.fillStyle='#d8cfe6'; g.beginPath(); g.ellipse(0,-30,10,8,0,0,6.28); g.fill();
   g.fillStyle='#d9b45a'; g.beginPath(); g.moveTo(-8,-36); g.lineTo(-6,-46); g.lineTo(-2,-39); g.lineTo(0,-48); g.lineTo(2,-39); g.lineTo(6,-46); g.lineTo(8,-36); g.closePath(); g.fill();
   g.strokeStyle='#4d4360'; g.lineWidth=1.5; g.beginPath(); g.moveTo(-3,-36); g.quadraticCurveTo(-12,-52,-18,-50); g.moveTo(3,-36); g.quadraticCurveTo(12,-52,18,-50); g.stroke();
   if(ph===3&&e.state!=='down'){ g.fillStyle='rgba(170,220,255,.75)'; g.beginPath(); g.moveTo(-11,-34); g.lineTo(11,-34); g.lineTo(8,-22); g.lineTo(0,-19); g.lineTo(-8,-22); g.closePath(); g.fill(); g.strokeStyle='#fff'; g.lineWidth=1; g.stroke(); }
   g.fillStyle=e.state==='down'?'#888':'#ff5b8a'; circ(g,-4,-30,2.2); g.fill(); circ(g,4,-30,2.2); g.fill();
   if(e.state==='down'){ for(let i=0;i<3;i++){ const a=e.t*5+i*2.1; g.fillStyle='#fff3a0'; circ(g,Math.cos(a)*14,-56+Math.sin(a)*4,2.5); g.fill(); } }
   g.restore(); g.globalAlpha=1; }
 },
 // ---------- raccoglibili & varie ----------
 shell:{r:8,init(e){ e.vz=120; e.z=0.1; e.life=12; }, update(e,dt){ if(e.z>0){ e.vz-=500*dt; e.z=Math.max(0,e.z+e.vz*dt);} e.life-=dt; if(e.life<=0) e.dead=true; if(Math.random()<0.02) addPart({x:e.x+rand(-5,5),y:e.y-10,vx:0,vy:-12,life:0.5,col:'#fff',size:1.5,type:'spark'}); },
  draw(g,e){ if(e.life<3&&Math.sin(e.t*30)>0) return; g.fillStyle='rgba(0,0,0,.22)'; ell(g,e.x,e.y,6,2.2); g.fill(); drawShell(g,e.x,e.y-e.z-7+Math.sin(e.t*4)*1.2,1.05,e.val>=5); } },
 heart:{r:8,init(e){ e.vz=110; e.z=0.1; e.life=12; }, update(e,dt){ if(e.z>0){ e.vz-=500*dt; e.z=Math.max(0,e.z+e.vz*dt);} e.life-=dt; if(e.life<=0) e.dead=true; },
  draw(g,e){ if(e.life<3&&Math.sin(e.t*30)>0) return; drawHeart(g,e.x,e.y-e.z-8+Math.sin(e.t*4)*1.5,7,1); } },
 firefly:{r:10,init(e){ e.by=e.y; }, update(e,dt){ e.y=e.by+Math.sin(e.t*2.5)*4; e.ox=Math.sin(e.t*1.7)*4; if(Math.random()<0.06) addPart({x:e.x+rand(-3,3),y:e.y-8,vx:rand(-8,8),vy:rand(-14,-4),life:0.9,col:'#eaff8a',size:1.5,type:'spark'}); },
  draw(g,e){ drawFirefly(g,e.x+(e.ox||0),e.y-8,1,e.t); } },
 piece:{r:10,draw(g,e){ const y=e.y-8+Math.sin(e.t*3)*2; g.save(); g.translate(e.x,y); g.rotate(Math.sin(e.t*2)*0.15); drawHeart(g,0,0,8,1,true); g.restore(); if(Math.random()<0.05) addPart({x:e.x+rand(-8,8),y:y+rand(-8,8),vx:0,vy:-12,life:0.6,col:'#fff',size:2,type:'spark'}); } },
 page:{r:10,draw(g,e){ const y=e.y-8+Math.sin(e.t*2.4)*2.5; g.save(); g.translate(e.x,y); g.rotate(Math.sin(e.t*1.6)*0.2); g.fillStyle='#f3e6c4'; g.fillRect(-7,-9,14,18); g.strokeStyle='#b39a6a'; g.lineWidth=1; g.strokeRect(-7,-9,14,18); g.strokeStyle='#7a6440'; for(let i=0;i<4;i++){ g.beginPath(); g.moveTo(-4,-5+i*4); g.lineTo(4-(i%2)*2,-5+i*4); g.stroke(); } g.restore(); if(Math.random()<0.04) addPart({x:e.x+rand(-8,8),y:y,vx:0,vy:-10,life:0.6,col:'#ffe9a8',size:1.6,type:'spark'}); } },
 keyp:{r:9,draw(g,e){ drawIcon(g,'key',e.x,e.y-10+Math.sin(e.t*3)*2,1); } },
 container:{r:12,draw(g,e){ const y=e.y-12+Math.sin(e.t*3)*2; drawHeart(g,e.x,y,12,1); g.strokeStyle='#ffe9a8'; g.lineWidth=2; g.globalAlpha=0.5+Math.sin(e.t*4)*0.3; circ(g,e.x,y,18+Math.sin(e.t*4)*2); g.stroke(); g.globalAlpha=1; } },
 flame:{r:12,draw(g,e){ drawFlameIcon(g,e.x,e.y-16+Math.sin(e.t*2.5)*3,e.fi,1.4,e.t); if(Math.random()<0.2) addPart({x:e.x+rand(-6,6),y:e.y-24,vx:0,vy:-30,life:0.6,col:['#8dff7a','#5fe0ff','#fff1a0'][e.fi],size:2,type:'ember'}); } },
 portal:{r:14,draw(g,e){ g.save(); g.translate(e.x,e.y-10); for(let i=0;i<3;i++){ g.strokeStyle=`rgba(${180+i*30},${200+i*20},255,${0.7-i*0.2})`; g.lineWidth=3; g.beginPath(); g.ellipse(0,0,16-i*4,9-i*2,0,e.t*(2+i)+i,e.t*(2+i)+i+4.2); g.stroke(); } g.fillStyle='rgba(220,240,255,.35)'; ell(g,0,0,12,6); g.fill(); g.restore(); if(Math.random()<0.2) addPart({x:e.x+rand(-12,12),y:e.y-8,vx:0,vy:-30,life:0.8,col:'#cfe8ff',size:2,type:'spark'}); } },
 npc:{r:12,init(e){ e.look=NPC[e.id].look; e.face='d'; }, update(e,dt){ const d=dist(e.x,e.y,P.x,P.y); if(d<70) e.face=faceOf(P.x-e.x,P.y-e.y); else if(Math.random()<0.005) e.face=pick(['d','l','r']); },
  draw(g,e){ drawPerson(g,e.x,e.y,e.look,e.face,e.t,false); if(dist(e.x,e.y,P.x,P.y)<52&&mode==='play'){ const by=e.y-60+Math.sin(T*4)*1.5; g.fillStyle='#fff'; g.strokeStyle=OL; g.lineWidth=1.3; rr(g,e.x-10,by-8,20,13,5); g.fill(); g.stroke(); g.beginPath(); g.moveTo(e.x-3,by+5); g.lineTo(e.x,by+9); g.lineTo(e.x+3,by+5); g.fill(); for(let i=0;i<3;i++){ g.fillStyle='#3a2a4a'; circ(g,e.x-5+i*5,by-1.5+Math.sin(T*6+i)*1.2,1.4); g.fill(); } } } },
 cat:{r:9,init(e){ e.face='l'; e.sleep=0; }, update(e,dt){ if(Math.random()<0.004) e.face=e.face==='l'?'r':'l'; },
  draw(g,e){ const s=e.face==='l'?-1:1, br=Math.sin(e.t*2)*0.6; g.save(); g.translate(e.x,e.y); g.scale(s,1); g.fillStyle='rgba(0,0,0,.25)'; ell(g,0,0,10,3); g.fill();
   g.strokeStyle='#3a2f2a'; g.lineWidth=3; g.lineCap='round'; g.beginPath(); g.moveTo(-8,-6); g.quadraticCurveTo(-16,-10+Math.sin(e.t*3)*4,-12,-20); g.stroke(); g.lineCap='butt';
   g.fillStyle='#3a2f2a'; g.beginPath(); g.ellipse(-2,-7,9,6+br,0,0,6.28); g.fill(); circ(g,7,-14,6); g.fill(); g.beginPath(); g.moveTo(3,-18); g.lineTo(4,-24); g.lineTo(7,-19); g.moveTo(8,-19); g.lineTo(11,-24); g.lineTo(12,-17); g.fill();
   g.fillStyle='#ffd34d'; const bl=Math.sin(e.t*0.8)>0.97; if(!bl){ circ(g,6,-15,1.5); g.fill(); circ(g,10,-15,1.5); g.fill(); } g.fillStyle='#f0a0b0'; circ(g,8.5,-12,1); g.fill(); g.restore(); } },
 frog:{r:9,init(e){ e.jump=0; e.ci=['verde','rossa','blu','gialla'].indexOf(e.col); }, update(e,dt){ e.jump=Math.max(0,e.jump-dt*3); },
  draw(g,e){ const cols={verde:'#4fbf5a',rossa:'#e5484d',blu:'#3f7fe0',gialla:'#f2c230'}; const c=cols[e.col], j=Math.sin(e.jump*Math.PI)*10, th=Math.sin(e.t*3)*1;
   g.save(); g.translate(e.x,e.y-j); g.fillStyle='rgba(0,0,0,.2)'; ell(g,0,j,9,3); g.fill(); g.fillStyle=c; g.beginPath(); g.ellipse(0,-7,10,7+th*0.5,0,0,6.28); g.fill(); circ(g,-5,-13,4); g.fill(); circ(g,5,-13,4); g.fill();
   g.fillStyle='#fff'; circ(g,-5,-14,2.6); g.fill(); circ(g,5,-14,2.6); g.fill(); g.fillStyle='#111'; circ(g,-5,-14,1.3); g.fill(); circ(g,5,-14,1.3); g.fill();
   if(e.jump>0){ g.fillStyle='#ffd0d8'; g.beginPath(); g.ellipse(0,-3,5,3*e.jump+1,0,0,6.28); g.fill(); } g.strokeStyle='rgba(0,0,0,.35)'; g.lineWidth=1; g.beginPath(); g.arc(0,-7,4,0.3,2.8); g.stroke(); g.restore(); } }
};

function spawnBoss(kind){
 const x=8*TS, y=kind==='muffa'?3.8*TS:kind==='anguilla'?5*TS:4*TS;
 const b=mkEnt(kind,x,y); ents.push(b); bossRef=b; P&&(P.dmgTaken=false);
 const d=EDEF[kind]; banner={text:d.name,sub:d.sub,t:3,boss:1}; AU.sfx('boss');
}
function bossDefeated(e){
 const fi={muffa:0,anguilla:1,gufo:2}[e.kind];
 S.got[room.bossKey]=1; bossRef=null; AU.setMusic('dungeon'); shake=14;
 for(let i=0;i<5;i++) setTimeout(()=>burst(e.x+rand(-30,30),e.y-20+rand(-20,20),['#fff','#ffe08a',EDEF[e.kind].col],24,220,4),i*150);
 if(!P.dmgTaken) award('intatto');
 for(const x of ents) if(x.enemy&&x!==e){ x.dead=true; burst(x.x,x.y,['#fff'],8,80); }
 if(e.kind==='falena'){ setTimeout(()=>startEnding(),1600); return; }
 ents.push(mkEnt('container',e.x-30,Math.max(e.y,3*TS)+20));
 ents.push(mkEnt('flame',e.x+30,Math.max(e.y,3*TS)+20,{fi}));
 save();
}
EDEF.muffa.onDeath=bossDefeated; EDEF.anguilla.onDeath=bossDefeated; EDEF.gufo.onDeath=bossDefeated; EDEF.falena.onDeath=bossDefeated;

// ---------- raccolta ----------
function collect(e){
 if(e.dead) return; e.dead=true; if(e.deco) return;
 switch(e.kind){
  case 'shell': S.shells=Math.min(999,S.shells+e.val); AU.sfx('coin'); if(!S.flags.firstShell){ S.flags.firstShell=1; pipSay('Una conchiglia! È la moneta della valle: spendila alla Bottega di Ciottolo, a sud del villaggio.'); } if(S.shells>=250) award('ricco'); break;
  case 'heart': S.hp=Math.min(S.maxhp,S.hp+2); AU.sfx('heart'); break;
  case 'firefly': S.got[e.gid]=1; gainFirefly(); break;
  case 'piece': S.got[e.gid]=1; gainPiece(); break;
  case 'page': S.got[e.gid]=1; gainPage(e.page); break;
  case 'keyp': S.got[e.gid]=1; S.keys[room.w]=(S.keys[room.w]||0)+1; AU.sfx('chest'); floatText(P.x,P.y-40,'Piccola chiave!','#ffe08a'); break;
  case 'container': S.maxhp+=2; S.hp=S.maxhp; AU.sfx('item'); P.hold='container'; say(['Hai ottenuto un Contenitore di Cuore!','La tua vita massima aumenta.'],()=>P.hold=null); break;
  case 'flame': { const names=['Fiamma del Bosco','Fiamma del Mare','Fiamma del Vento']; S.flames++; S.flags['flame'+e.fi]=1; AU.sfx('item'); P.hold='flame'+e.fi;
   say([`Hai recuperato la ${names[e.fi]}!`, `Fiamme recuperate: ${S.flames}/3.`, S.flames<3?'Pip: Un passo più vicini a riaccendere la Grande Lanterna!':'Pip: Tutte e tre! Il sigillo del Nido, a nord-est, adesso non può più fermarci!'],()=>{ P.hold=null; ents.push(mkEnt('portal',8*TS,6.2*TS,{to:room.def.exit})); save(); });
   break; }
 }
 save();
}
function gainFirefly(){ S.fireflies++; if(S.fireflies===1) setTimeout(()=>pipSay('Una lucciola persa! Ogni 6 che ritroviamo, un lampione di Brumafonda si riaccende.'),1200); AU.sfx('firefly'); floatText(P.x,P.y-44,`Lucciola ritrovata! ${S.fireflies}/${TOTAL_FIREFLIES}`,'#eaff8a'); burst(P.x,P.y-20,['#eaff8a','#fff'],16,90,2,'spark');
 if([6,12,18,24].includes(S.fireflies)) setTimeout(()=>pipSay('Un lampione di Brumafonda si è appena acceso!'),900);
 if(S.fireflies>=TOTAL_FIREFLIES) award('lucciole'); }
function gainPiece(){ S.pieces++; AU.sfx('item'); P.hold='piece'; const n=S.pieces%4;
 if(n===0){ S.maxhp+=2; S.hp=S.maxhp; award('cuore'); say(['Frammento di Cuore! (4/4)','I frammenti si fondono in un cuore intero! La tua vita massima aumenta.'],()=>P.hold=null); }
 else say([`Frammento di Cuore! (${n}/4)`, 'Raccogline quattro per ottenere un cuore intero.'],()=>P.hold=null); }
function gainPage(i){ if(!S.pages.includes(i)) S.pages.push(i); AU.sfx('secret'); if(S.pages.length>=6) award('biblio');
 say([{paper:true,text:`Diario di Orsola — pagina ${i+1}\n\n${PAGES[i]}`}, `Pagine del diario: ${S.pages.length}/6.`]); }
function giveItem(name){ S.items[name]=true; if(name!=='pertica') S.sel=name; AU.sfx('item'); P.hold=name;
 const tips={pertica:'Premi A (Spazio/J) per colpire. Tieni premuto e rilascia per il fendente rotante.',lanterna:'Equipaggiata nello slot B (tasto K). Prova sui rovi e sulle torce spente!',rampino:'Usalo con B (tasto K): punta un palo dall\'altra parte del baratro.',campana:'Suonala con B (tasto K). Cambia oggetto con il pulsante ⟳ (tasto Q).'};
 say([`Hai ottenuto: ${ITEMS[name].name}!`, ITEMS[name].desc, tips[name]],()=>{P.hold=null; save();}); }
function award(id){ if(S.trophies[id]) return; S.trophies[id]=1; const t=TROPHIES.find(x=>x[0]===id); if(!t) return; toast(`🏆 Trofeo: ${t[1]}`); AU.sfx('secret'); save(); }
let toastQ=[]; function toast(t){ toastQ.push({t,life:3.2}); }
function pipSay(t){ pipMsg={text:t,life:3.6}; }
let pipMsg=null;
function onKonami(){ if(!S||mode==='title'){ pendingKonami=true; AU.sfx('secret'); const el=document.getElementById('logo'); el&&el.classList.add('rainbow'); return; } S.konami=true; award('konami'); AU.sfx('secret'); floatText(P.x,P.y-50,'Modalità Lucciola Arcobaleno!','#ffb3f0'); }
let pendingKonami=false;

// ---------- disegni condivisi ----------
function drawHeart(g,x,y,s,fill,piece){ g.save(); g.translate(x,y); g.scale(s/8,s/8);
 g.beginPath(); g.moveTo(0,6); g.bezierCurveTo(-10,-1,-7,-9,0,-4); g.bezierCurveTo(7,-9,10,-1,0,6); g.closePath();
 g.fillStyle='#4a1a22'; g.fill();
 if(fill>0){ g.save(); if(fill<1){ g.beginPath(); g.rect(-10,-10,10,20); g.clip(); } g.beginPath(); g.moveTo(0,6); g.bezierCurveTo(-10,-1,-7,-9,0,-4); g.bezierCurveTo(7,-9,10,-1,0,6); g.fillStyle=piece?'#ff7a9a':'#ff4d5e'; g.fill(); g.fillStyle='rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-3.5,-3,1.8,1.2,-0.6,0,6.28); g.fill(); g.restore(); }
 if(piece){ g.strokeStyle='#fff'; g.lineWidth=1; g.beginPath(); g.moveTo(0,-4); g.lineTo(0,6); g.moveTo(-6,0); g.lineTo(6,0); g.stroke(); }
 g.strokeStyle='#2a0c12'; g.lineWidth=1; g.beginPath(); g.moveTo(0,6); g.bezierCurveTo(-10,-1,-7,-9,0,-4); g.bezierCurveTo(7,-9,10,-1,0,6); g.stroke(); g.restore(); }
function drawFirefly(g,x,y,s,t,rainbow){ const gl=0.6+Math.sin(t*6)*0.4; const col=rainbow?`hsl(${(t*120)%360},100%,70%)`:'#eaff8a';
 const gr=g.createRadialGradient(x,y,0,x,y,12*s); gr.addColorStop(0,rainbow?col:`rgba(234,255,138,${0.7*gl})`); gr.addColorStop(1,'rgba(234,255,138,0)'); g.fillStyle=gr; circ(g,x,y,12*s); g.fill();
 g.fillStyle='rgba(255,255,255,.7)'; const w=Math.sin(t*30)*0.5+0.5; g.beginPath(); g.ellipse(x-3*s,y-3*s,3*s,(1.5+w)*s,-0.6,0,6.28); g.fill(); g.beginPath(); g.ellipse(x+3*s,y-3*s,3*s,(1.5+w)*s,0.6,0,6.28); g.fill();
 g.fillStyle='#3a3020'; g.beginPath(); g.ellipse(x,y-1*s,2*s,3*s,0,0,6.28); g.fill(); g.fillStyle=col; circ(g,x,y+2*s,2.4*s); g.fill(); }
function drawFlameIcon(g,x,y,i,s,t){ const cols=[['#d6ffb0','#5fd04a'],['#d0f8ff','#2fb8e0'],['#fffbe0','#ffcf3a']][i]; g.save(); g.translate(x,y); g.scale(s,s); const f=Math.sin(t*9)*1.2;
 const gr=g.createRadialGradient(0,2,1,0,0,12); gr.addColorStop(0,cols[0]); gr.addColorStop(1,cols[1]); g.fillStyle=gr; g.beginPath(); g.moveTo(-6,4); g.quadraticCurveTo(-7+f,-6,0,-13+f); g.quadraticCurveTo(7-f,-6,6,4); g.quadraticCurveTo(0,9,-6,4); g.fill(); g.fillStyle='rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(0,1,2.5,4,0,0,6.28); g.fill(); g.restore(); }
function drawIcon(g,name,x,y,s){ g.save(); g.translate(x,y); g.scale(s,s);
 switch(name){
  case 'pertica': g.rotate(-0.7); g.fillStyle='#8a5a2b'; g.fillRect(-1.5,-12,3,24); g.strokeStyle='#e0b85a'; g.lineWidth=2; g.beginPath(); g.arc(3,-12,3.5,3.2,6); g.stroke(); g.fillStyle='#ffcf6b'; circ(g,0,-12,1.8); g.fill(); break;
  case 'lanterna': g.strokeStyle='#3a3540'; g.lineWidth=1.5; g.beginPath(); g.arc(0,-9,4,3.14,0); g.stroke(); g.fillStyle='#3a3540'; rr(g,-6,-7,12,3,1); g.fill(); g.fillStyle='#ffcf6b'; rr(g,-5,-4,10,11,2); g.fill(); g.fillStyle='#fff5c8'; g.beginPath(); g.ellipse(0,1,2,3.5,0,0,6.28); g.fill(); g.fillStyle='#3a3540'; g.fillRect(-6,7,12,3); g.fillRect(-0.7,-4,1.4,11); break;
  case 'rampino': g.strokeStyle='#9aa0a8'; g.lineWidth=2; g.beginPath(); g.moveTo(-8,8); g.lineTo(2,-2); g.stroke(); g.strokeStyle='#d9dde3'; g.lineWidth=2.2; g.beginPath(); g.moveTo(2,-2); g.lineTo(8,-8); g.moveTo(8,-8); g.lineTo(9,-2); g.moveTo(8,-8); g.lineTo(2,-9); g.stroke(); g.fillStyle='#8a5a2b'; rr(g,-10,6,6,5,1.5); g.fill(); break;
  case 'campana': g.fillStyle='#bfe6ff'; g.beginPath(); g.moveTo(-8,6); g.quadraticCurveTo(-7,-9,0,-10); g.quadraticCurveTo(7,-9,8,6); g.closePath(); g.fill(); g.fillStyle='rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(-3,-3,1.5,4,0.2,0,6.28); g.fill(); g.fillStyle='#7fb5d9'; g.fillRect(-9,5,18,2.5); circ(g,0,9,2); g.fill(); g.fillStyle='#d9b45a'; g.fillRect(-1.2,-13,2.4,3); break;
  case 'key': g.fillStyle='#ffd34d'; circ(g,0,-5,4.5); g.fill(); g.fillStyle='#8a6a1a'; circ(g,0,-5,1.8); g.fill(); g.fillStyle='#ffd34d'; g.fillRect(-1.3,-1,2.6,11); g.fillRect(1,5,4,2); g.fillRect(1,8,3,2); break;
  case 'shell': drawShell(g,0,0,1,false); break;
  case 'piece': drawHeart(g,0,0,8,1,true); break;
  case 'container': drawHeart(g,0,0,10,1); break;
  case 'flame0': drawFlameIcon(g,0,0,0,1,T); break; case 'flame1': drawFlameIcon(g,0,0,1,1,T); break; case 'flame2': drawFlameIcon(g,0,0,2,1,T); break;
 }
 g.restore(); }

// persona generica (NPC e protagonista)
// ===================== PERSONAGGI (chibi con contorno) =====================
const OL='#3a2433';
function shade(hex,k){ const n=parseInt(hex.slice(1),16); let r=n>>16,gg=(n>>8)&255,b=n&255; r=clamp(Math.round(r*k),0,255); gg=clamp(Math.round(gg*k),0,255); b=clamp(Math.round(b*k),0,255); return '#'+((1<<24)|(r<<16)|(gg<<8)|b).toString(16).slice(1); }
function drawPerson(g,x,y,L,face,t,moving,walk){
 const s=L.size||1, side=face==='l'||face==='r', up=face==='u';
 const sw=moving?Math.sin(walk):0, bob=moving?-Math.abs(Math.sin(walk))*1.6:Math.sin(t*2.2+x)*0.5;
 const fo=(c,lw=1.3)=>{ g.fillStyle=c; g.fill(); g.strokeStyle=OL; g.lineWidth=lw; g.stroke(); };
 g.save(); g.translate(x,y); g.scale(s,s);
 drawSoftShadow(g,0,0,10,3.6,40,x,y);
 if(face==='l') g.scale(-1,1);
 if(L.turtle){ drawTurtle(g,face,t,fo); g.restore(); return; }
 const boots=L.boots||'#5a3a26', pants=L.pants||'#4a3a3a', body=L.body, body2=L.body2||shade(body,0.72), skin=L.skin, hair=L.hair;
 // gambe e stivali
 if(side){ for(const k of [-1,1]){ const o=k*sw*3.5; g.beginPath(); rr(g,-3+o,-11,6,7,2); fo(pants); g.beginPath(); rr(g,-3.5+o,-6-(k*sw>0?1.5:0),8,6,2.5); fo(boots); } }
 else for(const k of [-1,1]){ const lift=Math.max(0,k*sw)*2.5; g.beginPath(); rr(g,k*4.2-3,-11-lift,6,7,2); fo(pants); g.beginPath(); rr(g,k*4.2-3.5,-6-lift,7,6,2.5); fo(boots); }
 g.translate(0,bob);
 const breath=Math.sin(t*2.3+x*0.13); if(!moving){ g.translate(0,-10); g.scale(1-breath*0.012,1+breath*0.032); g.translate(0,10); }
 // braccio posteriore (vista laterale)
 const arm=(ax,ay,rot,dark)=>{ g.save(); g.translate(ax,ay); g.rotate(rot); g.beginPath(); rr(g,-2.4,-1,4.8,10,2.4); fo(dark?body2:body); g.beginPath(); circ(g,0,10,2.6); fo(skin,1.1); g.restore(); };
 if(side) arm(-1,-23,-sw*0.7,true);
 // mantello/zaino dietro
 if(L.pack&&!up){ g.beginPath(); rr(g,side?-12:-8,-27,side?8:16,side?14:4,3); fo('#7a5230'); }
 if(L.cape&&!up){ g.beginPath(); g.moveTo(-7,-24); g.quadraticCurveTo(-12-sw*2,-12,-10-Math.sin(t*3)*2,-6); g.lineTo(side?-2:8,-6); g.closePath(); fo(L.cape); }
 // corpo
 g.beginPath(); if(side) rr(g,-6.5,-27,13,18,5); else rr(g,-8.5,-27,17,18,5); fo(body);
 g.save(); g.beginPath(); if(side) rr(g,-6.5,-27,13,18,5); else rr(g,-8.5,-27,17,18,5); g.clip(); g.fillStyle=body2; g.fillRect(-12,-15,24,8); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(side?-4:-6,-26,side?3:4,8);
 if(L.apron&&!up){ g.fillStyle=L.apron; if(side) g.fillRect(1,-21,6,12); else { g.beginPath(); rr(g,-5.5,-21,11,13,3); g.fill(); } }
 if(L.collar&&!up){ g.fillStyle=L.collar; g.beginPath(); g.moveTo(side?-1:-5,-27); g.lineTo(side?6:0,-21); g.lineTo(side?6:5,-27); g.fill(); }
 g.restore();
 if(L.belt){ g.fillStyle=L.belt; g.fillRect(side?-6.5:-8.5,-14.5,side?13:17,2.8); if(!up){ g.fillStyle='#e8c060'; g.fillRect(side?3:-2,-15,3.5,3.8); } }
 if(up&&L.pack){ g.beginPath(); rr(g,-7,-27,14,15,4); fo('#7a5230'); g.fillStyle='#5a3a20'; g.fillRect(-7,-21,14,2); }
 // sciarpa
 if(L.scarf){ g.beginPath(); rr(g,side?-6:-8,-29,side?12:16,5,2.5); fo(L.scarf,1.1);
   const wv=Math.sin(t*5)*1.5+(moving?-2:0); g.beginPath(); if(side){ g.moveTo(-5,-27); g.quadraticCurveTo(-11,-25+wv,-15+(moving?-2:0),-20+wv); g.lineTo(-11,-21+wv); g.quadraticCurveTo(-8,-23,-4,-25); }
   else if(!up){ g.moveTo(3,-26); g.quadraticCurveTo(7,-22+wv,8,-15+wv); g.lineTo(5,-16+wv); g.quadraticCurveTo(4,-21,1,-25); }
   else { g.moveTo(-2,-26); g.quadraticCurveTo(-3,-20+wv,-1,-14+wv); g.lineTo(3,-15+wv); g.quadraticCurveTo(2,-21,2,-26); }
   fo(L.scarf,1.1); }
 // braccia
 if(side) arm(1.5,-23,sw*0.8,false);
 else for(const k of [-1,1]) arm(k*9,-24,k*0.12+(up?-1:1)*k*sw*0.35,false);
 // testa
 const hy=-38, R=10.5;
 if(L.hairStyle==='long'||L.hairStyle==='bun'&&up){ g.beginPath(); rr(g,side?-11:-10.5,hy-2,side?14:21,side?13:15,6); fo(hair); }
 if(L.hairStyle==='braids'&&!side){ for(const k of [-1,1]){ g.beginPath(); circ(g,k*10,hy+6,3.4); fo(hair,1.1); g.beginPath(); circ(g,k*10.5,hy+11,2.6); fo(hair,1.1); } }
 if(L.hairStyle==='braids'&&side){ g.beginPath(); circ(g,-9,hy+7,3.4); fo(hair,1.1); }
 if(L.hat==='hood'){ g.beginPath(); circ(g,0,hy+1,R+3); fo(L.hatc); }
 g.beginPath(); circ(g,0,hy,R); fo(skin);
 // capelli (ritagliati sulla testa)
 g.save(); g.beginPath(); circ(g,0,hy,R-0.2); g.clip(); g.fillStyle=hair;
 const spiky=L.hairStyle==='spiky', bald=L.hairStyle==='bald';
 if(up){ g.fillRect(-12,hy-14,24,21); }
 else if(side){ if(!bald){ g.fillRect(-12,hy-14,11.5,23); g.beginPath(); g.moveTo(-12,hy-14); g.lineTo(12,hy-14); g.lineTo(12,hy-5); for(let i=0;i<4;i++){ const xx=12-i*5; g.lineTo(xx-2.5,hy-(spiky?0:2)-(i%2)*2); g.lineTo(xx-5,hy-5); } g.lineTo(-12,hy-3); g.fill(); } }
 else if(!bald){ g.beginPath(); g.moveTo(-12,hy-14); g.lineTo(12,hy-14); g.lineTo(12,hy-1); const n=spiky?5:4; for(let i=0;i<n;i++){ const x0=12-i*24/n; g.lineTo(x0-12/n,hy-(spiky?0.5:3)-(i%2)*1.5); g.lineTo(x0-24/n,hy-5); } g.lineTo(-12,hy-1); g.fill(); }
 else { g.fillRect(-12,hy-1,4,6); g.fillRect(8,hy-1,4,6); }
 g.fillStyle='rgba(255,255,255,.22)'; if(!bald) { g.beginPath(); g.ellipse(side?0:-3,hy-8,4,1.6,-0.3,0,6.28); g.fill(); }
 g.restore();
 g.beginPath(); circ(g,0,hy,R); g.strokeStyle=OL; g.lineWidth=1.3; g.stroke();
 if(L.hairStyle==='bun'&&!side&&!up){ g.beginPath(); circ(g,0,hy-11,4.4); fo(hair,1.1); }
 if(L.hairStyle==='bun'&&side){ g.beginPath(); circ(g,-7,hy-8,4.2); fo(hair,1.1); }
 // viso
 const blink=Math.sin(t*1.3+x*0.37)>0.985;
 const eye=(ex,ey)=>{ if(blink){ g.strokeStyle='#2a1830'; g.lineWidth=1.3; g.beginPath(); g.moveTo(ex-1.8,ey); g.lineTo(ex+1.8,ey); g.stroke(); return; } g.fillStyle='#2a1830'; g.beginPath(); g.ellipse(ex,ey,1.8,2.7,0,0,6.28); g.fill(); g.fillStyle='#fff'; circ(g,ex-0.6,ey-1.1,0.8); g.fill(); };
 if(side){ g.beginPath(); g.ellipse(-0.5,hy+2.5,2,2.6,0,0,6.28); g.fillStyle=skin; g.fill(); g.strokeStyle=OL; g.lineWidth=1; g.beginPath(); g.arc(-0.5,hy+2.5,2.4,Math.PI*0.6,Math.PI*1.5); g.stroke();
   eye(5.2,hy+1.5); g.fillStyle='rgba(255,110,110,.35)'; circ(g,4.5,hy+5.5,1.8); g.fill();
   g.strokeStyle='#7a3a30'; g.lineWidth=1; g.beginPath(); g.moveTo(7.2,hy+6.5); g.lineTo(9,hy+6.2); g.stroke();
   if(L.nose){ g.beginPath(); g.moveTo(8,hy); g.quadraticCurveTo(15,hy+4,9,hy+5); fo(skin,1.1); }
   if(L.glasses){ g.strokeStyle='#d9b45a'; g.lineWidth=1.1; circ(g,5.2,hy+1.5,3.2); g.stroke(); g.beginPath(); g.moveTo(2,hy+1); g.lineTo(-1,hy); g.stroke(); }
   if(L.beard){ g.beginPath(); g.moveTo(-2,hy+3); g.quadraticCurveTo(1,hy+12,9,hy+8); g.lineTo(9.5,hy+5.5); g.quadraticCurveTo(4,hy+8,-1,hy+2); fo(L.beard,1.1); } }
 else if(!up){ eye(-3.8,hy+2); eye(3.8,hy+2); g.fillStyle='rgba(255,110,110,.35)'; circ(g,-6.2,hy+5.6,1.9); g.fill(); circ(g,6.2,hy+5.6,1.9); g.fill();
   g.strokeStyle='#7a3a30'; g.lineWidth=1; g.beginPath(); g.arc(0,hy+5.5,1.6,0.3,2.8); g.stroke();
   if(L.nose){ g.beginPath(); g.moveTo(-1.5,hy+2); g.lineTo(0,hy+7); g.lineTo(1.5,hy+2); fo(skin,1); }
   if(L.glasses){ g.strokeStyle='#d9b45a'; g.lineWidth=1.1; circ(g,-3.8,hy+2,3.2); g.stroke(); circ(g,3.8,hy+2,3.2); g.stroke(); g.beginPath(); g.moveTo(-0.6,hy+2); g.lineTo(0.6,hy+2); g.stroke(); }
   if(L.beard){ g.beginPath(); g.moveTo(-8,hy+2); g.quadraticCurveTo(0,hy+16,8,hy+2); g.quadraticCurveTo(4,hy+8,0,hy+8); g.quadraticCurveTo(-4,hy+8,-8,hy+2); fo(L.beard,1.1); } }
 // cappelli
 const hc=L.hatc;
 if(L.hat==='cap'){ g.beginPath(); g.arc(0,hy-3,R+0.6,Math.PI,0); g.closePath(); fo(hc);
   g.fillStyle='rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(-3,hy-9,4,1.8,-0.3,0,6.28); g.fill();
   if(side){ g.beginPath(); rr(g,2,hy-5,14,3.6,1.8); fo(shade(hc,0.8),1.1); g.beginPath(); circ(g,5,hy-8,1.8); fo('#e8c060',0.9); }
   else if(!up){ g.beginPath(); g.ellipse(0,hy-3.5,12.5,3,0,0,6.28); fo(shade(hc,0.8),1.1); g.beginPath(); circ(g,0,hy-9,2); fo('#e8c060',0.9); }
   else { g.beginPath(); g.ellipse(0,hy-3,11.5,2.2,0,0,Math.PI); fo(shade(hc,0.8),1.1); } }
 if(L.hat==='wide'){ g.beginPath(); g.ellipse(0,hy-6,16,4.6,0,0,6.28); fo(hc); g.beginPath(); g.arc(0,hy-7,7.5,Math.PI,0); g.closePath(); fo(shade(hc,0.9)); g.fillStyle=shade(hc,0.6); g.fillRect(-7.4,hy-9,14.8,2); }
 if(L.hat==='witch'){ g.beginPath(); g.ellipse(0,hy-6,15,4,0,0,6.28); fo(hc); g.beginPath(); g.moveTo(-8,hy-7); g.quadraticCurveTo(-2,hy-20,8,hy-30+Math.sin(t*2)); g.quadraticCurveTo(3,hy-18,8,hy-7); g.closePath(); fo(hc); g.fillStyle='#b48ad6'; g.fillRect(-7.5,hy-10,15.5,2.5); }
 if(L.hat==='band'){ g.save(); g.beginPath(); circ(g,0,hy,R); g.clip(); g.fillStyle=hc; g.fillRect(-12,hy-14,24,8); g.restore(); g.beginPath(); g.arc(0,hy,R,Math.PI*1.13,Math.PI*1.87); g.strokeStyle=OL; g.lineWidth=1.3; g.stroke(); g.strokeStyle='#e85a5a'; g.lineWidth=2; g.beginPath(); g.moveTo(-10,hy-6); g.lineTo(10,hy-6); g.stroke(); if(!side) { g.beginPath(); circ(g,side?-9:9,hy-5,2); fo(hc,1); } }
 if(L.hat==='hood'){ g.save(); g.beginPath(); circ(g,0,hy,R+0.5); g.clip(); g.fillStyle=hc; g.fillRect(-14,hy-14,28,6); if(side) g.fillRect(-14,hy-14,11,24); g.restore(); }
 g.restore();
}
function drawTurtle(g,face,t,fo){
 const up=face==='u', side=face==='l'||face==='r', br=Math.sin(t*1.5)*0.6;
 for(const k of [-1,1]){ g.beginPath(); g.ellipse(k*10,-3,4.5,3.5,0,0,6.28); fo('#8cc078'); }
 g.beginPath(); g.ellipse(0,-13,15,12+br,0,0,6.28); fo('#5b7f3a');
 g.save(); g.beginPath(); g.ellipse(0,-13,15,12+br,0,0,6.28); g.clip(); g.strokeStyle='#3f5f28'; g.lineWidth=1.5; for(let i=-1;i<=1;i++){ g.beginPath(); g.moveTo(i*8,-26); g.lineTo(i*6,-2); g.stroke(); } g.beginPath(); g.moveTo(-16,-13); g.lineTo(16,-13); g.stroke(); g.fillStyle='#6fa04a'; circ(g,-6,-21,3.5); g.fill(); circ(g,4,-23,2.8); g.fill(); g.fillStyle='rgba(255,255,255,.15)'; g.beginPath(); g.ellipse(-5,-19,6,3,-0.4,0,6.28); g.fill(); g.restore();
 if(up){ g.beginPath(); circ(g,0,-27,6); fo('#8cc078'); g.beginPath(); rr(g,-6,-37,12,5,2); fo('#8a3d2a'); return; }
 const hx=side?13:0, hy=side?-20:-24;
 g.beginPath(); circ(g,hx,hy,7.5); fo('#9ccc86');
 const ex=side?hx+3:hx; g.fillStyle='#1d1420'; if(side){ circ(g,ex,hy-1,1.6); g.fill(); } else { circ(g,ex-3,hy-1,1.6); g.fill(); circ(g,ex+3,hy-1,1.6); g.fill(); }
 g.strokeStyle='#4a6a3a'; g.lineWidth=1; g.beginPath(); g.arc(side?hx+3:hx,hy+2.5,2,0.3,2.8); g.stroke();
 g.beginPath(); g.ellipse(hx,hy-6.5,8,2.2,0,0,6.28); fo('#8a3d2a',1.1); g.beginPath(); rr(g,hx-5,hy-13,10,6,2); fo('#a84a32',1.1); g.fillStyle='#e8c060'; g.fillRect(hx-5,hy-9.5,10,1.6);
}
