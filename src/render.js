// ===================== RENDER =====================
const lightCv=document.createElement('canvas'); lightCv.width=VW/2; lightCv.height=VH/2; const lctx=lightCv.getContext('2d');
const FONT='Fredoka, "Trebuchet MS", sans-serif';

function render(){
 ctx.setTransform(K,0,0,K,0,0); ctx.imageSmoothingEnabled=true;
 ctx.fillStyle='#0d0a14'; ctx.fillRect(0,0,GW,GH);
 if(mode==='title'){ renderTitle(ctx); paperOverlay(ctx); return; }
 if(mode==='ending'){ renderEnding(ctx); paperOverlay(ctx); return; }
 if(!room||!P) return;
 ctx.save(); ctx.beginPath(); ctx.rect(0,HUD,VW,VH); ctx.clip();
 if(mode==='trans'&&trans){ const k=easeInOut(Math.min(1,trans.t/0.5));
  ctx.drawImage(snapCv,0,HUD*K,VW*K,VH*K,-k*trans.dx*VW,HUD-k*trans.dy*VH,VW,VH);
  ctx.translate((1-k)*trans.dx*VW,HUD+(1-k)*trans.dy*VH); renderWorld(ctx); }
 else { const sx=shake?rand(-shake,shake)*0.6:0, sy=shake?rand(-shake,shake)*0.6:0; ctx.translate(sx,HUD+sy); renderWorld(ctx); }
 ctx.restore();
 renderHUD(ctx);
 paperOverlay(ctx);
 if(bossRef&&!bossRef.dead) renderBossBar(ctx);
 if(banner) renderBanner(ctx);
 if(toastQ.length) renderToast(ctx);
 if(mode==='dialog'&&dlg&&dlg.cur) renderDialog(ctx);
 if(mode==='dead'){ ctx.fillStyle=`rgba(10,5,20,${Math.min(0.85,deadT*0.6)})`; ctx.fillRect(0,0,GW,GH); if(deadT>0.8){ ctx.globalAlpha=Math.min(1,deadT-0.8); ctx.fillStyle='#ffe9b0'; ctx.font=`600 24px ${FONT}`; ctx.textAlign='center'; ctx.fillText('Ilio si è spento...',GW/2,GH/2-10); ctx.font=`16px ${FONT}`; ctx.fillStyle='#cdbfe0'; ctx.fillText('...ma la fiamma resta. Premi A per rialzarti.',GW/2,GH/2+20); ctx.globalAlpha=1; } }
 if(mode==='warp'&&fade){ const a=fade.t<0.35?fade.t/0.35:1-(fade.t-0.35)/0.35; ctx.fillStyle=`rgba(5,3,10,${clamp(a,0,1)})`; ctx.fillRect(0,0,GW,GH); }
}

function renderWorld(g){
 if(room.dirty||!room.cache) buildCache();
 g.drawImage(room.cache,0,0,VW,VH);
 collectShadowLights();
 drawDynTiles(g);
 drawFoliage(g);
 // particelle a terra
 for(const p of parts) if(p.type==='ripple'){ const k=1-p.life/p.max; g.strokeStyle=`rgba(220,250,255,${0.6*(1-k)})`; g.lineWidth=1.2; ell(g,p.x,p.y,4+k*10,2+k*4); g.stroke(); }
 // entità ordinate per y
 const list=ents.map(e=>({y:e.y,e})); list.push({y:P.y,hero:1}); for(const t of room.trees||[]) list.push({y:t[1]*TS+26,tree:t});
 list.sort((a,b)=>a.y-b.y);
 for(const it of list){ if(it.tree){ drawCanopy(g,it.tree[0],it.tree[1]); continue; } if(it.hero) drawHero(g); else { const e=it.e, d=EDEF[e.kind]; if(!d.draw) continue;
   if(e.inv>0&&Math.sin(T*50)>0&&e.enemy){ g.globalAlpha=0.5; }
   if(e.enemy&&!d.fly&&e.kind!=='velo'&&!e.boss&&!(e.kind==='anguilla')){ drawSoftShadow(g,e.x,e.y,e.r*0.9,e.r*0.35,e.r*2.2); }
   if(e.enemy){ g.save(); const br=Math.sin(e.t*3.2)*(e.stun>0?0.01:0.045); g.translate(e.x,e.y); g.scale(1+br*0.6,1-br); g.translate(-e.x,-e.y); }
   if(e.stun>0&&e.enemy&&e.kind!=='guardia'&&!e.boss){ g.save(); g.translate(rand(-0.8,0.8),0); d.draw.call(d,g,e); g.restore(); for(let i=0;i<2;i++){ const a=T*6+i*3; g.fillStyle='#fff3a0'; circ(g,e.x+Math.cos(a)*9,e.y-26-(e.z||0)+Math.sin(a)*3,1.8); g.fill(); } }
   else d.draw.call(d,g,e);
   if(e.enemy) g.restore();
   g.globalAlpha=1; } }
 drawClouds(g);
 // proiettili
 for(const p of projs) drawProj(g,p);
 // anelli della campana
 for(const r of rings){ const a=r.life/0.6; g.strokeStyle=`rgba(200,235,255,${a})`; g.lineWidth=4*a+1; circ(g,r.x,r.y,r.r); g.stroke(); g.strokeStyle=`rgba(255,255,255,${a*0.5})`; g.lineWidth=1.5; circ(g,r.x,r.y,r.r*0.8); g.stroke(); }
 // particelle
 for(const p of parts) if(p.type!=='ripple') drawPart(g,p);
 // pip
 if(pip) drawFirefly(g,pip.x,pip.y,1.1,T,S.konami);
 renderLight(g);
 // testi fluttuanti
 g.textAlign='center'; g.font=`600 13px ${FONT}`;
 for(const f of floaters){ g.globalAlpha=Math.min(1,f.life*1.5); g.lineWidth=3; g.strokeStyle='rgba(20,10,30,.85)'; g.strokeText(f.text,clamp(f.x,90,VW-90),f.y); g.fillStyle=f.col; g.fillText(f.text,clamp(f.x,90,VW-90),f.y); }
 g.globalAlpha=1;
 if(pipMsg&&pip) drawBubble(g,pip.x,pip.y-14,pipMsg.text,Math.min(1,pipMsg.life*2));
}

function drawHero(g){
 g.save();
 if(P.falling>0){ const k=P.falling/0.55; g.translate(P.x,P.y); g.scale(k,k); g.rotate((1-k)*6); g.translate(-P.x,-P.y); }
 if(P.inv>0&&mode==='play'&&Math.sin(T*45)>0) g.globalAlpha=0.35;
 const swinging=P.swing>0, base=Math.atan2(P.fy,P.fx);
 const pole=(ang,len,trail)=>{ const hx=P.x+P.fx*3, hy=P.y-17; const ex=hx+Math.cos(ang)*len, ey=hy+Math.sin(ang)*len*0.85;
   g.strokeStyle='#6d4727'; g.lineWidth=4; g.lineCap='round'; g.beginPath(); g.moveTo(hx,hy); g.lineTo(ex,ey); g.stroke(); g.strokeStyle='#a8743c'; g.lineWidth=2; g.beginPath(); g.moveTo(hx,hy); g.lineTo(ex,ey); g.stroke(); g.lineCap='butt';
   g.strokeStyle='#e0b85a'; g.lineWidth=2.5; g.beginPath(); g.arc(ex+Math.cos(ang)*2,ey+Math.sin(ang)*2,3.5,ang-2,ang+1); g.stroke();
   if(P.charged||trail){ const gr=g.createRadialGradient(ex,ey,0,ex,ey,9); gr.addColorStop(0,'rgba(255,240,170,.95)'); gr.addColorStop(1,'rgba(255,170,60,0)'); g.fillStyle=gr; circ(g,ex,ey,9); g.fill(); } };
 // pertica sulla schiena
 const back=()=>{ g.strokeStyle='#6d4727'; g.lineWidth=3; g.lineCap='round'; const s=P.face==='l'?1:-1; g.beginPath(); g.moveTo(P.x+s*7,P.y-8); g.lineTo(P.x-s*8,P.y-38); g.stroke(); g.lineCap='butt'; g.strokeStyle='#e0b85a'; g.lineWidth=2; g.beginPath(); g.arc(P.x-s*8,P.y-40,3,0,4); g.stroke(); };
 const idle=!swinging&&P.spin<=0&&S.items.pertica&&!P.hold;
 if(idle&&P.face!=='u') back();
 if(swinging&&P.face==='u'){ const p=easeOut(1-P.swing/0.24); pole(base-1.5+p*3,28,1); }
 if(P.hook){ const h=P.hook, hx=P.x+P.fx*6, hy=P.y-14; g.strokeStyle='#9aa0a8'; g.lineWidth=1.5; g.setLineDash([3,2]); g.beginPath(); g.moveTo(hx,hy); g.lineTo(h.x,h.y); g.stroke(); g.setLineDash([]);
   g.save(); g.translate(h.x,h.y); g.rotate(Math.atan2(h.dy,h.dx)); g.strokeStyle='#e0e4ea'; g.lineWidth=2.5; g.beginPath(); g.moveTo(-4,0); g.lineTo(4,0); g.moveTo(4,0); g.lineTo(0,-5); g.moveTo(4,0); g.lineTo(0,5); g.stroke(); g.restore(); }
 P.sqk=(P.sqk||0)*0.86; if(P.moving!==P.wasMoving){ P.sqk+=P.moving?0.06:-0.05; P.wasMoving=P.moving; }
 g.save(); g.translate(P.x,P.y); g.rotate(clamp(P.vx/122,-1,1)*0.06); g.scale(1+P.sqk,1-P.sqk); g.translate(-P.x,-P.y);
 drawPerson(g,P.x,P.y,HERO,P.face,T,P.moving,P.walk);
 g.restore();
 if(idle&&P.face==='u') back();
 if(swinging&&P.face!=='u'){ const p=easeOut(1-P.swing/0.24); const a0=base-1.5, a=a0+p*3;
   g.strokeStyle='rgba(255,250,220,.55)'; g.lineWidth=7; g.beginPath(); g.ellipse(P.x+P.fx*3,P.y-17,30,25.5,0,a0+p*1.2,a); g.stroke(); g.strokeStyle='rgba(255,255,255,.9)'; g.lineWidth=2; g.beginPath(); g.ellipse(P.x+P.fx*3,P.y-17,30,25.5,0,Math.max(a0,a-0.6),a); g.stroke();
   pole(a,28,1); }
 if(P.spin>0){ const p=1-P.spin/0.42, a=base+p*Math.PI*2.2; g.strokeStyle='rgba(255,220,140,.6)'; g.lineWidth=8; g.beginPath(); g.ellipse(P.x,P.y-14,34,28,0,a-2,a); g.stroke(); pole(a,30,1); }
 if(P.charging||P.charged){ if(Math.random()<0.4) addPart({x:P.x+rand(-12,12),y:P.y-rand(0,30),vx:0,vy:-30,life:0.4,col:'#ffe08a',size:1.8,type:'spark'}); }
 if(P.hold){ const y=P.y-56+Math.sin(T*4)*1.5; const gr=g.createRadialGradient(P.x,y,0,P.x,y,22); gr.addColorStop(0,'rgba(255,245,200,.8)'); gr.addColorStop(1,'rgba(255,245,200,0)'); g.fillStyle=gr; circ(g,P.x,y,22); g.fill();
   for(let i=0;i<6;i++){ const a=T*1.5+i*1.047; g.strokeStyle='rgba(255,240,180,.5)'; g.lineWidth=2; g.beginPath(); g.moveTo(P.x+Math.cos(a)*14,y+Math.sin(a)*14); g.lineTo(P.x+Math.cos(a)*22,y+Math.sin(a)*22); g.stroke(); }
   drawIcon(g,P.hold,P.x,y,1.5); }
 g.restore();
}

function drawProj(g,p){
 switch(p.k){
  case 'fire': { const gr=g.createRadialGradient(p.x,p.y,0,p.x,p.y,10); gr.addColorStop(0,'#fff6c8'); gr.addColorStop(0.5,'#ffaa33'); gr.addColorStop(1,'rgba(255,80,20,0)'); g.fillStyle=gr; circ(g,p.x,p.y,10); g.fill(); break; }
  case 'spore': g.fillStyle='#b25aa8'; circ(g,p.x,p.y,5); g.fill(); g.fillStyle='#e7a6e0'; circ(g,p.x-1.5,p.y-1.5,1.8); g.fill(); break;
  case 'bubble': g.strokeStyle='rgba(220,250,255,.9)'; g.lineWidth=2; circ(g,p.x,p.y,6); g.stroke(); g.fillStyle='rgba(150,220,255,.35)'; circ(g,p.x,p.y,6); g.fill(); g.fillStyle='#fff'; circ(g,p.x-2,p.y-2,1.5); g.fill(); break;
  case 'feather': g.save(); g.translate(p.x,p.y); g.rotate(Math.atan2(p.vy,p.vx)); g.fillStyle='#e9c47a'; g.beginPath(); g.ellipse(0,0,8,2.6,0,0,6.28); g.fill(); g.strokeStyle='#8a6028'; g.lineWidth=1; g.beginPath(); g.moveTo(-8,0); g.lineTo(8,0); g.stroke(); g.restore(); break;
  case 'dust': g.fillStyle='rgba(200,190,215,.85)'; circ(g,p.x,p.y,5); g.fill(); g.fillStyle='rgba(255,255,255,.6)'; circ(g,p.x,p.y,2); g.fill(); break;
  case 'orb': { const gr=g.createRadialGradient(p.x,p.y,0,p.x,p.y,9); gr.addColorStop(0,'#f0d8ff'); gr.addColorStop(0.4,'#7a3fd0'); gr.addColorStop(1,'rgba(40,10,80,0)'); g.fillStyle=gr; circ(g,p.x,p.y,9); g.fill(); break; }
 }
}
function drawPart(g,p){
 const a=clamp(p.life/p.max,0,1);
 switch(p.type){
  case 'leaf': g.save(); g.translate(p.x,p.y); g.rotate(p.life*8); g.fillStyle=p.col; g.globalAlpha=a; g.beginPath(); g.ellipse(0,0,p.size,p.size*0.5,0,0,6.28); g.fill(); g.restore(); g.globalAlpha=1; break;
  case 'petal': g.save(); g.translate(p.x+Math.sin(p.life*2)*8,p.y); g.rotate(p.life*3); g.fillStyle=p.col; g.globalAlpha=Math.min(1,p.life); g.beginPath(); g.ellipse(0,0,p.size,p.size*0.55,0,0,6.28); g.fill(); g.restore(); g.globalAlpha=1; break;
  case 'glass': g.save(); g.translate(p.x,p.y); g.rotate(p.life*10); g.fillStyle=p.col; g.globalAlpha=a; g.beginPath(); g.moveTo(0,-p.size); g.lineTo(p.size*0.8,p.size*0.6); g.lineTo(-p.size*0.6,p.size*0.4); g.fill(); g.restore(); g.globalAlpha=1; break;
  case 'splat': { const r=p.size*(1.8-a*0.8); const gr=g.createRadialGradient(p.x,p.y,0,p.x,p.y,r); gr.addColorStop(0,p.col); gr.addColorStop(0.75,p.col); gr.addColorStop(1,'rgba(0,0,0,0)'); g.globalAlpha=a*0.35; g.fillStyle=gr; circ(g,p.x,p.y,r); g.fill(); g.globalAlpha=a*0.25; g.strokeStyle=p.col; g.lineWidth=1.5; circ(g,p.x,p.y,r*0.92); g.stroke(); g.globalAlpha=1; break; }
  case 'smoke': g.fillStyle=p.col; g.globalAlpha=a*0.6; circ(g,p.x,p.y,p.size*(1.6-a*0.6)); g.fill(); g.globalAlpha=1; break;
  case 'bubble': g.strokeStyle=p.col; g.lineWidth=1; g.globalAlpha=Math.min(1,p.life); circ(g,p.x+Math.sin(p.life*5)*2,p.y,p.size); g.stroke(); g.globalAlpha=1; break;
  case 'note': g.fillStyle=p.col; g.globalAlpha=a; g.font=`700 ${p.size+6}px ${FONT}`; g.textAlign='center'; g.fillText('♪',p.x+Math.sin(p.life*6)*4,p.y); g.globalAlpha=1; break;
  case 'mote': g.fillStyle=p.col; g.globalAlpha=Math.sin(a*Math.PI)*0.9; circ(g,p.x+Math.sin(p.life*3)*3,p.y,p.size); g.fill(); g.globalAlpha=1; break;
  case 'ash': g.fillStyle=p.col; g.globalAlpha=Math.min(1,p.life*0.5); g.fillRect(p.x+Math.sin(p.life*2)*6,p.y,p.size,p.size*0.7); g.globalAlpha=1; break;
  case 'ember': case 'spark': g.fillStyle=p.col; g.globalAlpha=a; circ(g,p.x,p.y,p.size*(0.5+a*0.5)); g.fill(); g.globalAlpha=1; break;
  default: g.fillStyle=p.col; g.globalAlpha=a; circ(g,p.x,p.y,p.size*(0.4+a*0.6)); g.fill(); g.globalAlpha=1;
 }
}

function renderLight(g){
 const dark=room.dark; if(dark<0.03) return;
 const L=[]; const fl=Math.sin(T*13)*3+Math.sin(T*7.3)*2;
 L.push({x:P.x,y:P.y-14,r:S.items.lanterna?115:78,c:'255,190,110'});
 if(pip) L.push({x:pip.x,y:pip.y,r:44,c:'220,255,140'});
 for(let ty=0;ty<CH;ty++) for(let tx=0;tx<CW;tx++){ const c=room.grid[ty][tx];
  if(c==='Y') L.push({x:tx*TS+16,y:ty*TS+4,r:100+fl,c:'255,170,80'});
  if(c==='l'&&lampLit(tx,ty)) L.push({x:tx*TS+16,y:ty*TS-2,r:90+fl*0.5,c:'255,210,120'});
  if(c==='L'&&tileAt(tx-1,ty)!=='L'&&tileAt(tx,ty-1)!=='L') L.push({x:tx*TS+32,y:ty*TS,r:50+S.flames*45+fl,c:'255,220,150'});
  if(c==='M'&&S.flames<3) L.push({x:tx*TS+16,y:ty*TS+16,r:60,c:'190,130,255'});
  if(c==='E'&&room.w!=='ow') L.push({x:tx*TS+16,y:ty*TS+16,r:46,c:'180,200,255'});
 }
 for(const e of ents){ if(e.kind==='firefly'||e.kind==='flame') L.push({x:e.x,y:e.y-10,r:52,c:'230,255,140'}); else if(e.kind==='portal'||e.kind==='container') L.push({x:e.x,y:e.y-10,r:70,c:'200,220,255'}); else if(e.kind==='muffa'&&e.burn>0) L.push({x:e.x,y:e.y-30,r:120,c:'255,150,60'}); else if(e.kind==='anguilla'&&e.state!=='under') L.push({x:e.x,y:e.y-36,r:60,c:'255,250,180'}); else if(e.kind==='falena') L.push({x:e.x,y:e.y-e.z-20,r:70,c:'200,160,255'}); else if(e.kind==='velo'&&e.vis>0.5) L.push({x:e.x,y:e.y-14,r:30,c:'200,220,255'}); }
 for(const p of projs){ if(p.k==='fire') L.push({x:p.x,y:p.y,r:70,c:'255,160,60'}); else if(p.k==='orb') L.push({x:p.x,y:p.y,r:24,c:'160,90,255'}); }
 for(const r of rings) L.push({x:r.x,y:r.y,r:r.r+20,c:'200,235,255',ring:1});
 const lg=lctx; lg.setTransform(0.5,0,0,0.5,0,0); lg.globalCompositeOperation='source-over'; lg.clearRect(0,0,VW,VH);
 lg.fillStyle=room.w==='ow'?`rgba(14,10,40,${dark})`:`rgba(8,5,18,${dark})`; lg.fillRect(0,0,VW,VH);
 lg.globalCompositeOperation='destination-out';
 for(const l of L){ const gr=lg.createRadialGradient(l.x,l.y,0,l.x,l.y,l.r); gr.addColorStop(0,'rgba(0,0,0,1)'); gr.addColorStop(0.55,'rgba(0,0,0,.7)'); gr.addColorStop(1,'rgba(0,0,0,0)'); lg.fillStyle=gr; lg.beginPath(); lg.arc(l.x,l.y,l.r,0,6.28); lg.fill(); }
 g.drawImage(lightCv,0,0,VW,VH);
 g.globalCompositeOperation='lighter';
 for(const l of L){ if(l.ring) continue; const gr=g.createRadialGradient(l.x,l.y,0,l.x,l.y,l.r*0.7); gr.addColorStop(0,`rgba(${l.c},${0.16*dark+0.04})`); gr.addColorStop(1,`rgba(${l.c},0)`); g.fillStyle=gr; g.beginPath(); g.arc(l.x,l.y,l.r*0.7,0,6.28); g.fill(); }
 g.globalCompositeOperation='source-over';
}

function drawBubble(g,x,y,text,a){
 const bf=Math.round(clamp(12/Math.min(1,CSS_S),12,16)); g.font=`500 ${bf}px ${FONT}`; const lines=wrap(g,text,170*bf/12); const w=Math.min(190*bf/12,Math.max(...lines.map(l=>g.measureText(l).width))+16), h=lines.length*bf*1.25+10;
 let bx=clamp(x-w/2,4,VW-w-4), by=clamp(y-h-8,4,VH-h-4);
 g.globalAlpha=a; g.fillStyle='rgba(255,252,235,.96)'; rr(g,bx,by,w,h,8); g.fill(); g.strokeStyle='#c9b46a'; g.lineWidth=1.5; g.stroke();
 g.beginPath(); g.moveTo(clamp(x,bx+10,bx+w-10)-5,by+h); g.lineTo(clamp(x,bx+10,bx+w-10),by+h+7); g.lineTo(clamp(x,bx+10,bx+w-10)+5,by+h); g.fill();
 g.fillStyle='#3a2a1a'; g.textAlign='left'; lines.forEach((l,i)=>g.fillText(l,bx+8,by+5+bf+i*bf*1.25)); g.globalAlpha=1;
}
function wrap(g,text,maxW){ const out=[]; for(const para of text.split('\n')){ if(!para){ out.push(''); continue; } let line=''; for(const w of para.split(' ')){ const t=line?line+' '+w:w; if(g.measureText(t).width>maxW&&line){ out.push(line); line=w; } else line=t; } out.push(line); } return out; }

// ---------- HUD (stile Zelda) e finestre (stile Final Fantasy) ----------
function ffWin(g,x,y,w,h,r=7){
 const gr=g.createLinearGradient(0,y,0,y+h); gr.addColorStop(0,'#3a5ad0'); gr.addColorStop(0.5,'#22389e'); gr.addColorStop(1,'#101c62');
 g.fillStyle='rgba(0,0,0,.35)'; rr(g,x+2,y+3,w,h,r); g.fill();
 g.fillStyle=gr; rr(g,x,y,w,h,r); g.fill();
 g.fillStyle='rgba(255,255,255,.07)'; rr(g,x+3,y+3,w-6,Math.min(14,h/3),r-2); g.fill();
 g.strokeStyle='#0a1030'; g.lineWidth=1; rr(g,x+0.5,y+0.5,w-1,h-1,r); g.stroke();
 g.strokeStyle='#eef1ff'; g.lineWidth=2; rr(g,x+2.5,y+2.5,w-5,h-5,r-1.5); g.stroke();
 g.strokeStyle='rgba(120,140,220,.6)'; g.lineWidth=1; rr(g,x+4.5,y+4.5,w-9,h-9,r-3); g.stroke();
}
function ffText(g,t,x,y,col='#fff'){ g.fillStyle='rgba(8,12,40,.9)'; g.fillText(t,x+1.2,y+1.2); g.fillStyle=col; g.fillText(t,x,y); }
function outText(g,t,x,y,col='#fff',lw=3){ g.lineJoin='round'; g.strokeStyle='#120a1a'; g.lineWidth=lw; g.strokeText(t,x,y); g.fillStyle=col; g.fillText(t,x,y); }
function hudFrame(g,x,y,w,h,badge,bcol){
 g.fillStyle='rgba(0,0,0,.4)'; rr(g,x+1,y+2,w,h,8); g.fill();
 const gr=g.createLinearGradient(0,y,0,y+h); gr.addColorStop(0,'#1a1f4a'); gr.addColorStop(1,'#0b0e26'); g.fillStyle=gr; rr(g,x,y,w,h,8); g.fill();
 g.strokeStyle='#5a4418'; g.lineWidth=4; rr(g,x,y,w,h,8); g.stroke();
 g.strokeStyle='#e8c46a'; g.lineWidth=2; rr(g,x,y,w,h,8); g.stroke();
 g.strokeStyle='rgba(255,240,190,.5)'; g.lineWidth=1; rr(g,x+3,y+3,w-6,h-6,5); g.stroke();
 for(const [cx,cy] of [[x,y],[x+w,y],[x,y+h],[x+w,y+h]]){ g.fillStyle='#e8c46a'; circ(g,cx,cy,2.4); g.fill(); g.fillStyle='#7a5a20'; circ(g,cx+0.5,cy+0.5,1); g.fill(); }
 if(badge){ g.fillStyle=bcol; circ(g,x+3,y+3,7); g.fill(); g.strokeStyle='#120a1a'; g.lineWidth=1.5; circ(g,x+3,y+3,7); g.stroke(); g.font=`700 10px ${FONT}`; g.textAlign='center'; g.fillStyle='#120a1a'; g.fillText(badge,x+3,y+6.5); }
}
let hudSelFlash=0, hudLast={hp:0,sh:0};
function renderHUD(g){
 const gr=g.createLinearGradient(0,0,0,HUD); gr.addColorStop(0,'#1c1846'); gr.addColorStop(1,'#0c0a22'); g.fillStyle=gr; g.fillRect(0,0,GW,HUD);
 g.fillStyle='#5a4418'; g.fillRect(0,HUD-4,GW,4); g.fillStyle='#e8c46a'; g.fillRect(0,HUD-3,GW,1.5); g.fillStyle='rgba(0,0,0,.4)'; g.fillRect(0,HUD,GW,3);
 // oggetti
 hudFrame(g,10,6,34,34,'B','#7cc4ff'); if(S.sel&&S.items[S.sel]) drawIcon(g,S.sel,27,24,1.35);
 if(hudSelFlash>0){ g.strokeStyle=`rgba(255,255,255,${hudSelFlash})`; g.lineWidth=3; rr(g,8,4,38,38,9); g.stroke(); }
 hudFrame(g,54,10,28,28,'A','#ffcf6b'); if(S.items.pertica) drawIcon(g,'pertica',68,25,1.05);
 // contatori
 g.textAlign='center';
 const counter=(cx,icon,val,col,dim)=>{ g.globalAlpha=dim?0.35:1; icon(); g.font=`700 14px ${FONT}`; outText(g,val,cx,41,col); g.globalAlpha=1; };
 counter(112,()=>drawShell(g,112,16,1.25,false),String(S.shells).padStart(3,'0'),'#ffffff');
 const inD=room.w!=='ow'; counter(156,()=>drawIcon(g,'key',156,17,1.05),inD?String(S.keys[room.w]||0):'–','#ffffff',!inD);
 counter(200,()=>drawFirefly(g,200,17,0.95,T),String(S.fireflies).padStart(2,'0'),'#eaff8a');
 g.font=`600 9px ${FONT}`; outText(g,'/'+TOTAL_FIREFLIES,222,41,'#b9d870',2.5);
 // fiamme
 hudFrame(g,240,10,62,28,null); for(let i=0;i<3;i++){ const fx=255+i*16; if(S.flags['flame'+i]) drawFlameIcon(g,fx,25,i,0.8,T); else { g.fillStyle='#252a52'; g.beginPath(); g.ellipse(fx,25,4,6,0,0,6.28); g.fill(); g.strokeStyle='#4a5288'; g.lineWidth=1; g.stroke(); } }
 // vita
 g.font=`700 11px ${FONT}`; g.textAlign='center'; const lx=418; outText(g,'— VITA —',lx,15,'#ff8a5a',3);
 const nh=S.maxhp/2, perRow=Math.min(nh,8), sz=nh>8?6.2:7.6, sp=nh>8?13:16, x0=lx-(perRow-1)*sp/2;
 for(let i=0;i<nh;i++){ const row=Math.floor(i/8), col=i%8; const f=clamp((S.hp-i*2)/2,0,1); const pulse=(S.hp<=2&&f>0)?1+Math.sin(T*10)*0.12:1; drawHeart(g,x0+col*sp,(nh>8?25:30)+row*12,sz*pulse,f); }
 if(S.hp<=2&&S.hp>0&&Math.sin(T*8)>0){ g.fillStyle='rgba(255,60,80,.10)'; g.fillRect(0,HUD,VW,VH); }
 if(hudSelFlash>0&&S.sel){ hudSelFlash-=1/60; g.font=`600 13px ${FONT}`; const t=ITEMS[S.sel].name, w=g.measureText(t).width+26; g.globalAlpha=Math.min(1,hudSelFlash*2); ffWin(g,8,HUD+6,w,28); g.textAlign='left'; ffText(g,t,21,HUD+25); g.globalAlpha=1; }
}
function renderBossBar(g){ const b=bossRef, d=EDEF[b.kind]; const w=300, x=(GW-w)/2, y=GH-38;
 ffWin(g,x,y,w,30); g.font=`600 11px ${FONT}`; g.textAlign='left'; ffText(g,d.name,x+12,y+19,'#ffe9b0');
 const bx=x+130, bw=w-144; g.fillStyle='#0a0f2a'; rr(g,bx,y+11,bw,9,4); g.fill(); const k=Math.max(0,b.hp)/b.maxhp; const hg=g.createLinearGradient(0,y+11,0,y+20); hg.addColorStop(0,'#ff8a6a'); hg.addColorStop(1,'#c8243a'); g.fillStyle=hg; rr(g,bx,y+11,bw*k,9,4); g.fill(); g.strokeStyle='#e8c46a'; g.lineWidth=1.2; rr(g,bx,y+11,bw,9,4); g.stroke(); }
function renderBanner(g){ const b=banner, a=Math.min(1,b.t*2,(3-b.t)*3); g.globalAlpha=clamp(a,0,1); g.textAlign='center';
 if(b.boss){ const w=320,h=74,x=(GW-w)/2,y=GH/2-60; ffWin(g,x,y,w,h); g.font=`700 26px ${FONT}`; ffText(g,b.text,GW/2,y+36,'#ffb0b8'); g.font=`500 14px ${FONT}`; ffText(g,b.sub,GW/2,y+58,'#e6eaff'); }
 else { g.font=`600 ${b.small?14:17}px ${FONT}`; const w=g.measureText(b.text).width+48; ffWin(g,GW/2-w/2,HUD+10,w,36); ffText(g,b.text,GW/2,HUD+33,b.small?'#e9d6ff':'#fff7d8');
   if(!b.small){ g.fillStyle='#e8c46a'; for(const s of [-1,1]){ g.beginPath(); g.moveTo(GW/2+s*(w/2-14),HUD+28); g.lineTo(GW/2+s*(w/2-10),HUD+24); g.lineTo(GW/2+s*(w/2-6),HUD+28); g.lineTo(GW/2+s*(w/2-10),HUD+32); g.fill(); } } }
 g.globalAlpha=1; }
function renderToast(g){ const t=toastQ[0], a=Math.min(1,t.life*2,(3.2-t.life)*4); g.globalAlpha=clamp(a,0,1); g.font=`600 13px ${FONT}`; const w=g.measureText(t.t).width+28; ffWin(g,GW-w-8,HUD+8,w,30); g.textAlign='left'; ffText(g,t.t,GW-w+6,HUD+28,'#ffe9b0'); g.globalAlpha=1; }
function renderDialog(g){
 const c=dlg.cur, paper=c.paper;
 if(paper){ g.font=`500 15px Georgia, serif`; const x=60,y=HUD+24,w=GW-120,h=GH-HUD-48; g.fillStyle='rgba(0,0,0,.5)'; g.fillRect(0,HUD,GW,GH-HUD); g.fillStyle='#f3e6c4'; rr(g,x,y,w,h,6); g.fill(); g.strokeStyle='#b39a6a'; g.lineWidth=2; g.stroke();
  g.fillStyle='rgba(150,110,60,.12)'; for(let i=0;i<12;i++) g.fillRect(x+10,y+40+i*24,w-20,1);
  const lines=wrap(g,c.text.slice(0,dlg.ch|0),w-40); g.fillStyle='#4a3420'; g.textAlign='left'; lines.forEach((l,i)=>g.fillText(l,x+20,y+34+i*22));
  if(dlg.ch>=c.text.length){ g.fillStyle='#7a5a3a'; g.fillText('▼',x+w-26,y+h-14+Math.sin(T*6)*2); } return; }
 const fs=Math.round(clamp(15/Math.min(1,CSS_S),15,20)), lh=Math.round(fs*1.38);
 g.font=`500 ${fs}px ${FONT}`; const all=wrap(g,c.text,GW-64);
 const h=Math.max(92,all.length*lh+28), x=12,y=GH-h-10,w=GW-24;
 ffWin(g,x,y,w,h,8);
 if(c.who){ g.font=`600 ${fs-2}px ${FONT}`; const nw=g.measureText(c.who).width+26; ffWin(g,x+10,y-24,nw,26,6); g.textAlign='left'; ffText(g,c.who,x+23,y-6,'#ffe08a'); }
 g.font=`500 ${fs}px ${FONT}`; const lines=wrap(g,c.text.slice(0,dlg.ch|0),GW-64); g.textAlign='left';
 lines.forEach((l,i)=>ffText(g,l,x+18,y+10+lh+i*lh));
 if(dlg.ch>=c.text.length){ const by=y+h-14+Math.abs(Math.sin(T*5))*-3; g.fillStyle='#fff'; g.beginPath(); g.moveTo(x+w-26,by-5); g.lineTo(x+w-16,by-5); g.lineTo(x+w-21,by+1); g.closePath(); g.fill(); }
}

// ---------- titolo ----------
const titleFlies=Array.from({length:40},()=>({x:Math.random()*GW,y:Math.random()*GH,p:Math.random()*6,s:rand(0.4,1)}));
function renderTitle(g){
 const gr=g.createLinearGradient(0,0,0,GH); gr.addColorStop(0,'#120c2a'); gr.addColorStop(0.55,'#2a1c48'); gr.addColorStop(1,'#4a2c4a'); g.fillStyle=gr; g.fillRect(0,0,GW,GH);
 for(let i=0;i<60;i++){ const x=hash(i,1)*GW, y=hash(i,2)*GH*0.6; g.fillStyle=`rgba(255,255,240,${0.3+0.5*Math.abs(Math.sin(T*0.8+i))})`; circ(g,x,y,hash(i,3)*1.3+0.3); g.fill(); }
 g.fillStyle='#f6eccc'; circ(g,GW*0.8,80,26); g.fill(); g.fillStyle='#2a1c48'; circ(g,GW*0.8-10,74,24); g.fill();
 const hill=(yb,amp,col,sp)=>{ g.fillStyle=col; g.beginPath(); g.moveTo(0,GH); for(let x=0;x<=GW;x+=8) g.lineTo(x,yb+Math.sin(x*0.012+sp)*amp+Math.sin(x*0.031+sp*2)*amp*0.4); g.lineTo(GW,GH); g.fill(); };
 hill(GH*0.62,18,'#2b2142',T*0.05); hill(GH*0.72,14,'#1f1832',1+T*0.08);
 // villaggio
 g.fillStyle='#150f22'; for(let i=0;i<7;i++){ const x=40+i*66+(i%2)*10, y=GH*0.74-hash(i,9)*10; g.fillRect(x,y,34,30); g.beginPath(); g.moveTo(x-4,y); g.lineTo(x+17,y-18); g.lineTo(x+38,y); g.fill(); g.fillStyle=Math.sin(T*2+i)>-0.6?'#ffcf6b':'#7a5a3a'; g.fillRect(x+12,y+10,8,8); g.fillStyle='#150f22'; }
 g.fillStyle='#0f0a18'; g.fillRect(GW/2-4,GH*0.6,8,60); g.beginPath(); g.moveTo(GW/2-16,GH*0.6); g.lineTo(GW/2,GH*0.56); g.lineTo(GW/2+16,GH*0.6); g.fill(); g.fillRect(GW/2-12,GH*0.6,24,20);
 g.fillStyle=`rgba(255,200,120,${0.1+0.05*Math.sin(T*3)})`; g.fillRect(GW/2-10,GH*0.6+2,20,16);
 hill(GH*0.84,10,'#0f0b18',2);
 for(const f of titleFlies){ f.p+=0.016; f.x+=Math.sin(f.p*0.7)*0.4; f.y+=Math.cos(f.p*0.5)*0.3-0.1; if(f.y<0) f.y=GH; const a=0.4+0.6*Math.abs(Math.sin(f.p*2)); const c=pendingKonami?`hsla(${(T*100+f.x)%360},100%,70%,${a})`:`rgba(234,255,138,${a})`; const r=g.createRadialGradient(f.x,f.y,0,f.x,f.y,8*f.s); r.addColorStop(0,c); r.addColorStop(1,'rgba(234,255,138,0)'); g.fillStyle=r; circ(g,f.x,f.y,8*f.s); g.fill(); }
}
function renderEnding(g){
 const t=END.t, dawn=clamp(t/8,0,1);
 const gr=g.createLinearGradient(0,0,0,GH); gr.addColorStop(0,`rgb(${18+dawn*80},${12+dawn*70},${42+dawn*60})`); gr.addColorStop(1,`rgb(${74+dawn*170},${44+dawn*110},${74+dawn*40})`); g.fillStyle=gr; g.fillRect(0,0,GW,GH);
 g.fillStyle=`rgba(255,220,150,${dawn})`; circ(g,GW*0.78,GH*0.86-dawn*30,34); g.fill();
 g.fillStyle='#1a1428'; g.beginPath(); g.moveTo(0,GH); for(let x=0;x<=GW;x+=8) g.lineTo(x,GH*0.78+Math.sin(x*0.02)*10); g.lineTo(GW,GH); g.fill();
 for(const f of titleFlies){ f.p+=0.016; f.y-=0.4; if(f.y<0) f.y=GH; const r=g.createRadialGradient(f.x,f.y,0,f.x,f.y,7); r.addColorStop(0,'rgba(234,255,138,.8)'); r.addColorStop(1,'rgba(234,255,138,0)'); g.fillStyle=r; circ(g,f.x,f.y,7); g.fill(); }
 g.textAlign='center'; const show=(txt,y,size,col,at)=>{ const a=clamp((t-at)*1.2,0,1); g.globalAlpha=a; g.fillStyle=col; g.font=`${size>20?700:500} ${size}px ${FONT}`; g.fillText(txt,GW/2,y); g.globalAlpha=1; };
 show(END.tru?'La notte è finita.':'La Lanterna arde di nuovo.',70,30,'#fff3d0',0.5);
 show(END.tru?'Brumafonda ha ritrovato la sua luce... e un nuovo amico.':'Ma da qualche parte, una piccola ombra ha ancora paura del buio.',100,14,'#f0e0ff',1.5);
 const m=Math.floor(S.stats.time/60), s=Math.floor(S.stats.time%60);
 const rows=[`Tempo di gioco: ${m}m ${String(s).padStart(2,'0')}s`,`Lucciole: ${S.fireflies}/${TOTAL_FIREFLIES}`,`Pagine del diario: ${S.pages.length}/6`,`Frammenti di cuore: ${S.pieces}/4`,`Trofei: ${Object.keys(S.trophies).length}/${TROPHIES.length}`,`Nemici sconfitti: ${S.stats.kills}   ·   Cadute: ${S.stats.falls}`];
 rows.forEach((r,i)=>show(r,145+i*22,15,'#ffe9d6',3+i*0.4));
 show(END.tru?'FINALE VERO':'Ritrova tutte le lucciole per il finale vero.',288,13,END.tru?'#eaff8a':'#cdbfe0',6);
 if(t>4&&Math.sin(T*4)>0) show('Premi A per tornare al titolo',GH-24,13,'#ffcf6b',4);
}
