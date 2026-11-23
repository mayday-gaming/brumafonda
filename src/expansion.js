// ===================== ESPANSIONE: SERRA DI VETRO =====================
Object.assign(EDEF,{
 // Spinarello: si chiude a riccio quando ti avvicini, poi rotola contro di te. Il fuoco lo fa scappare.
 spinarello:{enemy:1,hp:2,r:10,col:'#9ad06a',
  init(e){ e.state='walk'; e.st=1; e.rot=0; },
  onHit(e,dmg,src){ if(src.type==='fire'){ e.state='flee'; e.st=1.3; return 1; } if(e.state==='curl'||e.state==='dash') return 'block'; },
  update(e,dt){ if(e.stun>0){ e.state='walk'; return; } e.st-=dt; const d=dist(e.x,e.y,P.x,P.y);
   if(e.state==='walk'){ toward(e,P.x,P.y,30); moveBox(e,e.vx*dt,e.vy*dt,solidE,8,7,3); if(d<66&&e.st<=0){ e.state='curl'; e.st=1.3; AU.tone(300,0.12,'square',0.04,1.6); } }
   else if(e.state==='curl'){ e.rot+=dt*6; if(e.st<=0){ e.state='dash'; e.st=0.55; toward(e,P.x,P.y,175); } }
   else if(e.state==='dash'){ e.rot+=dt*22; const r=moveBox(e,e.vx*dt,e.vy*dt,solidE,8,7,3); if(Math.random()<0.4) addPart({x:e.x,y:e.y,vx:0,vy:-8,life:0.4,col:'rgba(160,200,120,.5)',size:3,type:'smoke'}); if(r.hitX||r.hitY||e.st<=0){ e.state='walk'; e.st=1.1; } }
   else if(e.state==='flee'){ const a=Math.atan2(e.y-P.y,e.x-P.x); moveBox(e,Math.cos(a)*95*dt,Math.sin(a)*95*dt,solidE,8,7,3); if(Math.random()<0.3) addPart({x:e.x,y:e.y-14,vx:0,vy:-20,life:0.4,col:'#ff9a3c',size:2,type:'ember'}); if(e.st<=0){ e.state='walk'; e.st=0.8; } } },
  draw(g,e){ const ball=e.state==='curl'||e.state==='dash'; g.save(); g.translate(e.x,e.y-10);
   if(ball){ g.rotate(e.rot); g.fillStyle='#e6f5b0'; for(let i=0;i<12;i++){ const a=i*0.5236; g.beginPath(); g.moveTo(Math.cos(a-0.18)*8,Math.sin(a-0.18)*8); g.lineTo(Math.cos(a)*15,Math.sin(a)*15); g.lineTo(Math.cos(a+0.18)*8,Math.sin(a+0.18)*8); g.fill(); }
    g.fillStyle='#5a9a3e'; circ(g,0,0,10); g.fill(); g.strokeStyle=OL; g.lineWidth=1.2; g.stroke(); g.fillStyle='rgba(255,255,255,.25)'; circ(g,-3,-3,3.5); g.fill(); }
   else { const w=Math.sin(e.t*12)*1.5;
    g.fillStyle='#e6f5b0'; for(let i=0;i<7;i++){ const a=Math.PI+i*0.52; g.beginPath(); g.moveTo(Math.cos(a-0.2)*9,Math.sin(a-0.2)*7); g.lineTo(Math.cos(a)*16,Math.sin(a)*13-2); g.lineTo(Math.cos(a+0.2)*9,Math.sin(a+0.2)*7); g.fill(); }
    g.fillStyle='#3e6a2a'; g.fillRect(-7,6+w*0.5,4,4); g.fillRect(3,6-w*0.5,4,4);
    g.fillStyle='#6fae4a'; g.beginPath(); g.ellipse(0,0,12,9,0,0,6.28); g.fill(); g.strokeStyle=OL; g.lineWidth=1.2; g.stroke();
    g.fillStyle='#c9e89a'; g.beginPath(); g.ellipse(0,3,7,4.5,0,0,6.28); g.fill();
    const lx=clamp((P.x-e.x)/50,-2,2); g.fillStyle='#fff'; circ(g,-3.5+lx,-2,2.6); g.fill(); circ(g,3.5+lx,-2,2.6); g.fill(); g.fillStyle='#1d1420'; circ(g,-3.5+lx*1.4,-2,1.3); g.fill(); circ(g,3.5+lx*1.4,-2,1.3); g.fill();
    if(e.state==='flee'){ g.fillStyle='#ff9a3c'; circ(g,0,-12,2.5); g.fill(); } }
   g.restore(); }
 },
 // Vespa di Vetro: gira intorno, si carica e scatta in linea retta. La campana la frantuma all'istante.
 vespa:{enemy:1,hp:1,r:9,col:'#bfefff',fly:1,
  init(e){ e.z=16; e.state='orbit'; e.st=rand(1.5,2.5); e.ang=rand(0,6.28); },
  onStun(e){ AU.sfx('shatter'); burst(e.x,e.y-e.z,['#dff6ff','#ffffff','#9fd8ff'],16,160,3,'glass',300); killEnemy(e); },
  update(e,dt){ e.st-=dt; e.z=lerp(e.z,16+Math.sin(e.t*6)*3,dt*5); if(e.stun>0) return;
   if(e.state==='orbit'){ e.ang+=dt*1.4; e.x=lerp(e.x,P.x+Math.cos(e.ang)*85,dt*2.4); e.y=lerp(e.y,P.y-10+Math.sin(e.ang)*60,dt*2.4); if(e.st<=0){ e.state='wind'; e.st=0.55; AU.tone(700,0.5,'sawtooth',0.03,1.5); } }
   else if(e.state==='wind'){ if(e.st<=0){ e.state='dash'; e.st=0.45; toward(e,P.x,P.y,275); } }
   else if(e.state==='dash'){ const r=moveBox(e,e.vx*dt,e.vy*dt,solidF,6,6,2); if(r.hitX||r.hitY||e.st<=0){ e.state='orbit'; e.st=rand(1.8,2.8); } }
   e.x=clamp(e.x,14,VW-14); e.y=clamp(e.y,24,VH-6); },
  draw(g,e){ const wind=e.state==='wind', fl=Math.sin(e.t*60); g.save(); g.translate(e.x+(wind?rand(-1,1):0),e.y-e.z);
   g.fillStyle='rgba(235,250,255,.55)'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*7,-6-fl,7,3.5,s*0.5,0,6.28); g.fill(); }
   g.fillStyle='rgba(170,225,255,.8)'; g.beginPath(); g.ellipse(0,4,5,7,0,0,6.28); g.fill(); g.strokeStyle='rgba(40,80,120,.8)'; g.lineWidth=1.2; g.stroke();
   g.strokeStyle='#3a6a8a'; g.lineWidth=1.5; for(let i=0;i<2;i++){ g.beginPath(); g.moveTo(-4.5,3+i*3.5); g.lineTo(4.5,3+i*3.5); g.stroke(); }
   g.fillStyle='#e8f8ff'; g.beginPath(); g.moveTo(-2,10); g.lineTo(0,15); g.lineTo(2,10); g.fill();
   g.fillStyle='rgba(200,240,255,.9)'; circ(g,0,-5,4.5); g.fill(); g.stroke();
   g.fillStyle=wind?'#ff4b5a':'#2a4a6a'; circ(g,-1.8,-5.5,1.4); g.fill(); circ(g,1.8,-5.5,1.4); g.fill();
   g.fillStyle='rgba(255,255,255,.8)'; circ(g,-2,1,1.3); g.fill(); g.restore(); }
 },
 // Regina Rovo e i suoi due rami spinosi
 regina:{enemy:1,hp:6,r:26,col:'#ff9ad0',boss:1,noKb:1,invT:0.5,name:'REGINA ROVO',sub:'Signora delle Spine',
  init(e){ e.boss=true; e.cd=2; e.n=0; e.arms=null; e.hinted=0; },
  open(e){ return !!e.arms&&e.arms.every(a=>a.burn>0); },
  onHit(e,dmg,src){ if(this.open(e)&&(src.type==='sword'||src.type==='spin')) return 1; if(src.type==='fire'||src.type==='bell'||src.type==='hook') return 'ignore'; if(!e.hinted){ e.hinted=1; pipSay('Il fiore è chiuso! Brucia tutti e due i rami spinosi con la lanterna!'); } return 'block'; },
  harm(e){ return false; },
  update(e,dt){
   if(!e.arms){ e.arms=[-1,1].map(s=>{ const a=mkEnt('ramo',e.x+s*60,e.y+40,{side:s,parent:e}); ents.push(a); return a; }); }
   e.cd-=dt; if(e.cd>0) return; e.n++; e.cd=this.open(e)?3.2:2.1;
   if(e.n%3===0){ projs.push({k:'wave',x:e.x,y:e.y+16,r:12,max:460,sp:150,life:5,hostile:1,dmg:1}); AU.sfx('wave'); shake=6; e.roar=0.8; }
   else { const free=e.arms.filter(a=>a.burn<=0&&a.state==='idle');
    if(e.n%3===1&&free.length){ const a=pick(free); a.state='lift'; a.st=0.75; a.tx=P.x; a.ty=P.y; }
    else { const base=Math.atan2(P.y-e.y,P.x-e.x); for(let i=-2;i<=2;i++){ const a=base+i*0.3; projs.push({k:'seed',x:e.x,y:e.y-30,vx:Math.cos(a)*125,vy:Math.sin(a)*125,life:3,hostile:1,dmg:1}); } AU.tone(260,0.2,'triangle',0.08,0.6); } } },
  draw(g,e){ const op=this.open(e), sw=Math.sin(e.t*1.3)*2, roar=(e.roar=Math.max(0,(e.roar||0)-1/60));
   g.save(); g.translate(e.x,e.y);
   drawSoftShadow(g,0,6,34,10,40,e.x,e.y);
   g.strokeStyle='#2f5a2a'; g.lineWidth=12; g.lineCap='round'; g.beginPath(); g.moveTo(0,8); g.quadraticCurveTo(sw*2,-14,sw,-34); g.stroke(); g.strokeStyle='#4f8a3a'; g.lineWidth=7; g.stroke(); g.lineCap='butt';
   for(const s of [-1,1]){ g.save(); g.translate(s*6,-8); g.rotate(s*(0.6+Math.sin(e.t*2+s)*0.12)); g.fillStyle='#5aa048'; g.beginPath(); g.ellipse(s*12,0,14,6,0,0,6.28); g.fill(); g.strokeStyle=OL; g.lineWidth=1.1; g.stroke(); g.restore(); }
   g.translate(sw,-44+roar*-4);
   if(op){ for(let i=0;i<8;i++){ g.save(); g.rotate(i*0.785+e.t*0.3); g.fillStyle=i%2?'#ff9ad0':'#ffb8e0'; g.beginPath(); g.ellipse(0,-17,8,15,0,0,6.28); g.fill(); g.strokeStyle=OL; g.lineWidth=1.1; g.stroke(); g.restore(); }
    const gr=g.createRadialGradient(0,0,0,0,0,14); gr.addColorStop(0,'#fff6c0'); gr.addColorStop(1,'#ffb02e'); g.fillStyle=gr; circ(g,0,0,12); g.fill(); g.strokeStyle=OL; g.stroke();
    g.fillStyle='#5a2a10'; g.strokeStyle='#5a2a10'; g.lineWidth=1.5; g.beginPath(); g.arc(-4,-1,2.2,Math.PI,0); g.stroke(); g.beginPath(); g.arc(4,-1,2.2,Math.PI,0); g.stroke(); circ(g,0,5,2); g.fill(); }
   else { g.fillStyle='#8a3d8a'; g.beginPath(); g.ellipse(0,0,19,26,0,0,6.28); g.fill(); g.strokeStyle=OL; g.lineWidth=1.3; g.stroke();
    g.strokeStyle='#c46ac4'; g.lineWidth=1.5; for(const s of [-1,0,1]){ g.beginPath(); g.moveTo(s*4,24); g.quadraticCurveTo(s*14,0,s*3,-24); g.stroke(); }
    g.fillStyle='#2f5a2a'; for(const s of [-1,1]){ g.beginPath(); g.moveTo(0,20); g.quadraticCurveTo(s*22,10,s*16,-6); g.quadraticCurveTo(s*8,8,0,20); g.fill(); }
    g.fillStyle='#ffe0f0'; circ(g,-6,-4,2.4); g.fill(); circ(g,6,-4,2.4); g.fill(); g.fillStyle='#3a0a2a'; circ(g,-6,-4,1.2); g.fill(); circ(g,6,-4,1.2); g.fill(); }
   g.fillStyle='#e8f0b0'; for(let i=0;i<5;i++){ const a=-Math.PI/2+(i-2)*0.38; g.beginPath(); g.moveTo(Math.cos(a-0.1)*20,Math.sin(a-0.1)*24-4); g.lineTo(Math.cos(a)*31,Math.sin(a)*34-4); g.lineTo(Math.cos(a+0.1)*20,Math.sin(a+0.1)*24-4); g.fill(); }
   g.restore(); }
 },
 ramo:{enemy:1,hp:99,r:13,col:'#8fd06a',noKb:1,noDrop:1,
  init(e){ e.state='idle'; e.burn=0; e.st=0; e.tipx=e.x; e.tipy=e.y; },
  onHit(e,dmg,src){ if(src.type==='fire'){ if(e.burn<=0){ e.burn=5.5; e.state='idle'; AU.sfx('burn'); burst(e.tipx,e.tipy,['#ff8a3c','#ffe08a'],16,130,3,'ember'); } return 'ignore'; } return 'block'; },
  onStun(){},
  harm(e){ return e.state==='slam'; },
  update(e,dt){ const q=e.parent; if(!q||q.dead){ e.dead=true; return; } e.burn-=dt; e.st-=dt;
   e.bx=q.x+e.side*30; e.by=q.y-4; let tx, ty;
   if(e.burn>0&&e.state!=='idle'&&e.state!=='recover'){ e.state='idle'; }
   if(e.state==='idle'){ tx=e.bx+e.side*(70+Math.sin(e.t*1.4+e.side)*14); ty=e.by+70+Math.cos(e.t*1.1)*16; if(e.burn>0) ty+=18; }
   else if(e.state==='lift'){ tx=e.tx; ty=e.ty-80; if(e.st<=0){ e.state='slam'; e.st=0.16; } }
   else if(e.state==='slam'){ tx=e.tx; ty=e.ty; if(e.st<=0){ e.state='recover'; e.st=1.1; shake=7; AU.sfx('wave'); projs.push({k:'wave',x:e.tx,y:e.ty,r:6,max:150,sp:170,life:2,hostile:1,dmg:1}); burst(e.tx,e.ty,['#8a6a40','#5a4a30','#b39a6a'],16,140,3,'dot',300); } }
   else { tx=e.tipx; ty=e.tipy; if(e.st<=0) e.state='idle'; }
   const k=e.state==='slam'?Math.min(1,dt*28):Math.min(1,dt*(e.state==='lift'?5:2.5)); e.tipx=lerp(e.tipx,tx,k); e.tipy=lerp(e.tipy,ty,k);
   e.x=e.tipx; e.y=e.tipy+10;
   if(e.burn>0&&Math.random()<0.3) addPart({x:e.tipx+rand(-8,8),y:e.tipy-rand(0,10),vx:0,vy:-35,life:0.6,col:pick(['#ff9a3c','#ffd27a']),size:2.2,type:'ember'}); },
  draw(g,e){ if(e.bx===undefined) return; const burnt=e.burn>0, lift=e.state==='lift';
   const cx=(e.bx+e.tipx)/2+e.side*30, cy=Math.min(e.by,e.tipy)-30;
   g.lineCap='round'; g.strokeStyle=burnt?'#2a1a14':'#24461f'; g.lineWidth=11; g.beginPath(); g.moveTo(e.bx,e.by); g.quadraticCurveTo(cx,cy,e.tipx,e.tipy); g.stroke();
   g.strokeStyle=burnt?'#5a3020':'#4f8a3a'; g.lineWidth=6.5; g.stroke(); g.lineCap='butt';
   g.fillStyle=burnt?'#ffb060':'#e8f0b0'; for(let i=1;i<9;i++){ const t=i/9, x=(1-t)*(1-t)*e.bx+2*(1-t)*t*cx+t*t*e.tipx, y=(1-t)*(1-t)*e.by+2*(1-t)*t*cy+t*t*e.tipy, s=i%2?1:-1; g.beginPath(); g.moveTo(x-2,y); g.lineTo(x+s*2,y-8*s); g.lineTo(x+2,y); g.fill(); }
   g.save(); g.translate(e.tipx,e.tipy); if(lift){ g.fillStyle=`rgba(255,80,80,${0.3+Math.abs(Math.sin(T*16))*0.4})`; circ(g,0,0,18); g.fill(); }
   g.fillStyle=burnt?'#3a2418':'#3e7a30'; circ(g,0,0,10); g.fill(); g.strokeStyle=OL; g.lineWidth=1.2; g.stroke();
   g.fillStyle=burnt?'#ff8a3c':'#e8f0b0'; for(let i=0;i<6;i++){ const a=i*1.047+e.t; g.beginPath(); g.moveTo(Math.cos(a-0.25)*9,Math.sin(a-0.25)*9); g.lineTo(Math.cos(a)*15,Math.sin(a)*15); g.lineTo(Math.cos(a+0.25)*9,Math.sin(a+0.25)*9); g.fill(); }
   g.restore();
   if(lift){ g.strokeStyle='rgba(255,80,80,.55)'; g.lineWidth=2; g.setLineDash([4,3]); ell(g,e.tx,e.ty,16,6); g.stroke(); g.setLineDash([]); } }
 },
 // raccoglibili dell'espansione
 ingr:{r:10,draw(g,e){ const y=e.y-8+Math.sin(e.t*3)*2; drawIcon(g,'ing_'+e.ing,e.x,y,1.15); if(Math.random()<0.04) addPart({x:e.x+rand(-8,8),y:y,vx:0,vy:-10,life:0.6,col:'#fff2b0',size:1.8,type:'spark'}); } },
 corolla:{r:12,draw(g,e){ const y=e.y-16+Math.sin(e.t*2.5)*3; drawIcon(g,'corolla',e.x,y,1.5); if(Math.random()<0.15) addPart({x:e.x+rand(-8,8),y:y,vx:0,vy:-25,life:0.7,col:'#ffd2ee',size:2,type:'spark'}); } }
});
EDEF.regina.onDeath=bossDefeated;

function drawExtraIcon(g,name){
 switch(name){
  case 'stivali': g.fillStyle='#8a5a30'; g.beginPath(); g.moveTo(-5,-9); g.lineTo(2,-9); g.lineTo(2,3); g.lineTo(9,4); g.quadraticCurveTo(11,8,8,9); g.lineTo(-5,9); g.closePath(); g.fill(); g.strokeStyle='#3a2433'; g.lineWidth=1; g.stroke();
   g.fillStyle='#c8945a'; g.fillRect(-5,-9,7,3); g.fillStyle='#fff'; g.beginPath(); g.moveTo(-4,-8); g.quadraticCurveTo(-12,-14,-9,-3); g.quadraticCurveTo(-7,-7,-4,-6); g.fill(); g.strokeStyle='#9fb0c0'; g.lineWidth=0.8; g.beginPath(); g.moveTo(-4,-7); g.lineTo(-9,-6); g.stroke(); break;
  case 'corolla': for(let i=0;i<6;i++){ g.save(); g.rotate(i*1.047+T*0.5); g.fillStyle=i%2?'#ff9ad0':'#ffc8e8'; g.beginPath(); g.ellipse(0,-7,4,7,0,0,6.28); g.fill(); g.restore(); } g.fillStyle='#ffd34d'; circ(g,0,0,4); g.fill(); g.fillStyle='#fff8d0'; circ(g,-1,-1,1.5); g.fill(); break;
  case 'ing_fungo': g.fillStyle='#efe3c9'; rr(g,-3,-1,6,9,2); g.fill(); g.fillStyle='#4a6ad8'; g.beginPath(); g.ellipse(0,-2,10,7,0,Math.PI,0); g.fill(); g.fillStyle='#ffe98a'; for(const [x,y] of [[-5,-5],[1,-7],[5,-4]]){ g.beginPath(); for(let k=0;k<5;k++){ const a=k*1.2566-Math.PI/2; g.lineTo(x+Math.cos(a)*2,y+Math.sin(a)*2); g.lineTo(x+Math.cos(a+0.628)*0.9,y+Math.sin(a+0.628)*0.9); } g.fill(); } break;
  case 'ing_miele': g.fillStyle='#ffb02e'; rr(g,-6,-5,12,13,4); g.fill(); g.strokeStyle='#7a4a10'; g.lineWidth=1; g.stroke(); g.fillStyle='#c97a20'; g.fillRect(-7,-8,14,4); g.fillStyle='#f0e0c0'; g.fillRect(-4,-1,8,5); g.fillStyle='rgba(255,255,255,.5)'; g.fillRect(-4,-4,2,9); break;
  case 'ing_sale': g.fillStyle='#e8e0d0'; g.beginPath(); g.moveTo(-7,8); g.quadraticCurveTo(-9,-2,-4,-5); g.lineTo(4,-5); g.quadraticCurveTo(9,-2,7,8); g.closePath(); g.fill(); g.strokeStyle='#8a7a60'; g.lineWidth=1; g.stroke(); g.strokeStyle='#5fa0d0'; g.lineWidth=1.5; g.beginPath(); g.moveTo(-5,-5); g.lineTo(5,-5); g.stroke(); g.fillStyle='#fff'; for(let i=0;i<4;i++){ circ(g,-3+i*2,-7-(i%2),1.1); g.fill(); } break;
 }
}
// collezionabili dell'espansione
function collectExtra(e){
 if(e.kind==='ingr'){ S.got[e.gid]=1; S.ingr=S.ingr||{}; S.ingr[e.ing]=1; AU.sfx('item'); P.hold='ing_'+e.ing; const n=Object.keys(S.ingr).length;
  say([`Hai trovato: ${INGREDIENTS[e.ing].name}!`, S.flags.cakeAsked?`Ingredienti per la torta di Lalla: ${n}/3.`:'Pip: Profuma di buono! Lalla, la fornaia, saprebbe cosa farne.'],()=>P.hold=null); return true; }
 if(e.kind==='corolla'){ S.flags.corolla=1; S.flags.regina=1; award('serra'); AU.sfx('item'); P.hold='corolla';
  say(['Hai ottenuto la Corolla di Luce!','Il fiore si posa sulla tua lanterna: ora le fiammate sono più grandi, arrivano più lontano e fanno il doppio dei danni.','Pip: E adesso, al Nido! Con gli stivali possiamo saltare la crepa davanti all\'ingresso.'],()=>{ P.hold=null; ents.push(mkEnt('portal',8*TS,6.2*TS,{to:room.def.exit})); save(); }); return true; }
 return false;
}
