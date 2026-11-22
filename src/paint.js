// ===================== ACQUERELLO, VEGETAZIONE VIVA, OMBRE =====================
// Carta: texture calda con fibre e granulazione, applicata in "multiply" su tutto lo schermo
const paperCv=document.createElement('canvas');
(function makePaper(){
 const w=GW*2,h=GH*2; paperCv.width=w; paperCv.height=h; const g=paperCv.getContext('2d');
 g.fillStyle='#fbf4e4'; g.fillRect(0,0,w,h);
 const id=g.getImageData(0,0,w,h), d=id.data;
 for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const i=(y*w+x)*4; const n=(Math.random()-0.5)*16+Math.sin(x*0.05+Math.sin(y*0.03)*2)*3; d[i]+=n; d[i+1]+=n; d[i+2]+=n*0.9; }
 g.putImageData(id,0,0);
 for(let i=0;i<420;i++){ const x=Math.random()*w, y=Math.random()*h, l=rand(10,40), a=rand(0,6.28); g.strokeStyle=`rgba(150,120,90,${rand(0.04,0.09)})`; g.lineWidth=rand(0.5,1.2); g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+Math.cos(a+0.5)*l/2,y+Math.sin(a+0.5)*l/2,x+Math.cos(a)*l,y+Math.sin(a)*l); g.stroke(); }
 for(let i=0;i<40;i++){ const x=Math.random()*w, y=Math.random()*h, r=rand(60,220); const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,`rgba(215,185,150,${rand(0.05,0.11)})`); gr.addColorStop(1,'rgba(215,185,150,0)'); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); }
 const vg=g.createRadialGradient(w/2,h/2,Math.min(w,h)*0.35,w/2,h/2,Math.max(w,h)*0.72); vg.addColorStop(0,'rgba(170,130,100,0)'); vg.addColorStop(1,'rgba(150,110,90,.32)'); g.fillStyle=vg; g.fillRect(0,0,w,h);
})();
function paperOverlay(g){ g.save(); g.globalCompositeOperation='multiply'; g.globalAlpha=0.85; g.drawImage(paperCv,0,0,GW,GH); g.restore(); }

// Post-processing della stanza: colori che sbavano, pigmento ai bordi, velature irregolari
const wcA=document.createElement('canvas'), wcB=document.createElement('canvas'), wcC=document.createElement('canvas');
function watercolorize(cv,key){
 const w=cv.width,h=cv.height, g=cv.getContext('2d');
 g.save(); g.setTransform(1,0,0,1,0,0); g.imageSmoothingEnabled=true;
 wcA.width=w; wcA.height=h; const a=wcA.getContext('2d'); a.drawImage(cv,0,0);
 // bordi di pigmento (differenza tra l'immagine e se stessa spostata, in scala di grigi e invertita)
 const bw=w/2|0, bh=h/2|0; wcB.width=bw; wcB.height=bh; const b=wcB.getContext('2d');
 b.globalCompositeOperation='source-over'; b.drawImage(wcA,0,0,bw,bh);
 b.globalCompositeOperation='difference'; b.drawImage(wcA,1.4,1.4,bw,bh);
 b.globalCompositeOperation='saturation'; b.fillStyle='#808080'; b.fillRect(0,0,bw,bh);
 b.globalCompositeOperation='difference'; b.fillStyle='#ffffff'; b.fillRect(0,0,bw,bh);
 // sbavatura: copia molto sfocata (riduzione + ingrandimento)
 const cw=w/7|0, ch=h/7|0; wcC.width=cw; wcC.height=ch; const c=wcC.getContext('2d'); c.imageSmoothingEnabled=true; c.drawImage(wcA,0,0,cw,ch);
 g.globalAlpha=0.34; g.drawImage(wcC,0,0,w,h);
 g.globalCompositeOperation='multiply'; g.globalAlpha=0.7; g.drawImage(wcB,0,0,w,h);
 // velature casuali ma stabili per stanza
 let s=0; for(const ch2 of key) s=(s*31+ch2.charCodeAt(0))>>>0; const r=()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; };
 g.globalAlpha=1;
 for(let i=0;i<40;i++){ const x=r()*w, y=r()*h, rad=(60+r()*170)*2; const gr=g.createRadialGradient(x,y,0,x,y,rad); gr.addColorStop(0,`rgba(${110+r()*40|0},${80+r()*40|0},${110+r()*30|0},${0.06+r()*0.07})`); gr.addColorStop(0.7,'rgba(120,90,110,.03)'); gr.addColorStop(1,'rgba(120,90,110,0)'); g.fillStyle=gr; g.fillRect(x-rad,y-rad,rad*2,rad*2); }
 g.globalCompositeOperation='screen';
 for(let i=0;i<16;i++){ const x=r()*w, y=r()*h, rad=(40+r()*120)*2; const gr=g.createRadialGradient(x,y,0,x,y,rad); gr.addColorStop(0,`rgba(255,246,226,${0.06+r()*0.08})`); gr.addColorStop(1,'rgba(255,246,226,0)'); g.fillStyle=gr; g.fillRect(x-rad,y-rad,rad*2,rad*2); }
 g.restore();
}

// ---------- ombre morbide e direzionali ----------
let shadowLights=[];
function collectShadowLights(){ shadowLights=[]; if(room.w==='ow') return; for(let ty=0;ty<CH;ty++) for(let tx=0;tx<CW;tx++) if(room.grid[ty][tx]==='Y') shadowLights.push([tx*TS+16,ty*TS+6]); }
function shadowVec(x,y){
 if(room.w==='ow'){ const a=0.55+Math.sin(T*0.015)*0.35; return {dx:Math.cos(a),dy:Math.sin(a)*0.6,k:clamp(1-room.dark*1.4,0.15,1)}; }
 let best=null, bd=230; for(const [lx,ly] of shadowLights){ const d=dist(x,y,lx,ly); if(d<bd){ bd=d; best=[lx,ly]; } }
 if(!best) return {dx:0.25,dy:0.35,k:0.35};
 const d=Math.max(1,bd); return {dx:(x-best[0])/d,dy:(y-best[1])/d*0.6,k:0.35+(1-bd/230)*0.8};
}
function drawSoftShadow(g,x,y,rx,ry,h,wx,wy){
 const v=shadowVec(wx===undefined?x:wx,wy===undefined?y:wy);
 g.fillStyle='rgba(46,28,72,.30)'; ell(g,x,y,rx,ry); g.fill();
 if(v.k>0.05){ const L=h*0.6*v.k; g.save(); g.translate(x,y); g.rotate(Math.atan2(v.dy,v.dx)); const gr=g.createLinearGradient(0,0,L+rx,0); gr.addColorStop(0,'rgba(46,28,72,.22)'); gr.addColorStop(1,'rgba(46,28,72,0)'); g.fillStyle=gr; g.beginPath(); g.ellipse(L*0.45,0,rx*0.7+L*0.5,ry*1.15,0,0,6.28); g.fill(); g.restore(); }
}

// ---------- erba e fiori che ondeggiano e si piegano al passaggio ----------
function windAt(x,y){ return Math.sin(T*1.6+x*0.045+y*0.02)*1.8+Math.sin(T*0.55+x*0.012)*1.4; }
function bendAt(x,y){ let b=0; const src=[P]; for(const e of ents) if(e.enemy&&!EDEF[e.kind].fly) src.push(e); for(const s of src){ if(!s) continue; const dx=x-s.x, dy=y-s.y; const d=Math.hypot(dx,dy); if(d<26&&d>0.1) b+=dx/d*(26-d)*0.32; } return b; }
function drawFoliage(g){
 if(room.w!=='ow') return;
 const dk=room.key==='ow:3,1'||room.key==='ow:3,0'||room.key==='ow:0,3';
 const blades=[], flowers=[];
 for(let ty=0;ty<CH;ty++) for(let tx=0;tx<CW;tx++){ const c=room.grid[ty][tx]; if(c!=='.'&&c!==',') continue;
  const x=tx*TS,y=ty*TS;
  for(let i=0;i<4;i++){ const bx=x+hash(tx,ty,i)*28+2, by=y+hash(tx,ty,i+9)*24+8, hgt=4+hash(tx,ty,i+40)*4; blades.push([bx,by,hgt,windAt(bx,by)+bendAt(bx,by)]); }
  if(c===','){ for(let i=0;i<3;i++){ const fx=x+4+hash(tx,ty,i+20)*24, fy=y+8+hash(tx,ty,i+30)*20; flowers.push([fx,fy,i,hash(tx,ty)]); } }
 }
 g.lineCap='round';
 g.strokeStyle=dk?'rgba(28,52,36,.42)':'rgba(46,104,52,.40)'; g.lineWidth=1.4; g.beginPath();
 for(const [bx,by,h,w] of blades){ g.moveTo(bx,by); g.quadraticCurveTo(bx+w*0.25,by-h*0.6,bx+w*0.7,by-h); }
 g.stroke();
 g.strokeStyle=dk?'rgba(110,150,110,.35)':'rgba(150,210,120,.45)'; g.lineWidth=1; g.beginPath();
 for(const [bx,by,h,w] of blades){ g.moveTo(bx+1.6,by); g.quadraticCurveTo(bx+1.6+w*0.25,by-h*0.5,bx+1.6+w*0.6,by-h*0.85); }
 g.stroke();
 for(const [fx,fy,i,h] of flowers){ const w=windAt(fx,fy)+bendAt(fx,fy), cx=fx+w*0.8, cy=fy-6;
  g.strokeStyle='rgba(60,110,55,.7)'; g.lineWidth=1.1; g.beginPath(); g.moveTo(fx,fy); g.quadraticCurveTo(fx+w*0.3,fy-3,cx,cy); g.stroke();
  const col=['#fff1c9','#ff9fc3','#ffd75e','#b9a7ff'][((h*4+i)|0)%4];
  g.fillStyle=col; g.globalAlpha=0.9; for(let k=0;k<5;k++){ const a=k*1.2566+T*0.2; circ(g,cx+Math.cos(a)*2,cy+Math.sin(a)*1.6,1.6); g.fill(); } g.globalAlpha=1;
  g.fillStyle='#f2b84a'; circ(g,cx,cy,1); g.fill(); }
 g.lineCap='butt';
}

// ---------- chiome degli alberi animate ----------
function drawCanopy(g,tx,ty){
 const x=tx*TS,y=ty*TS,h=hash(tx,ty); const sw=Math.sin(T*1.05+tx*0.8+ty*0.5)*1.5+Math.sin(T*2.4+tx*1.7)*0.45;
 const dk=room.key==='ow:3,1'||room.key==='ow:0,3'; const cols=dk?['#2c4a3a','#36584a','#467060']:['#356f44','#43874e','#5aa45e'];
 const blob=(cx,cy,r,col,k)=>{ g.fillStyle=col; circ(g,cx+sw*k,cy+Math.abs(sw)*0.1*k,r); g.fill(); };
 g.globalAlpha=0.96;
 blob(x+16,y+13,15.5,cols[0],0.5);
 g.strokeStyle='rgba(20,45,35,.35)'; g.lineWidth=1.6; circ(g,x+16+sw*0.5,y+13,15.5); g.stroke();
 blob(x+12,y+11,10,cols[1],0.8); blob(x+21,y+12,9,cols[1],0.8);
 g.globalAlpha=0.85; blob(x+11,y+7,6,cols[2],1); blob(x+19,y+6,4.5,cols[2],1);
 g.fillStyle='rgba(255,255,230,.18)'; circ(g,x+10+sw,y+5,3); g.fill();
 g.globalAlpha=1;
 if(h>0.7){ g.fillStyle='#e05a4a'; circ(g,x+9+h*10+sw*0.8,y+14,2.2); g.fill(); g.fillStyle='rgba(255,255,255,.6)'; circ(g,x+8.5+h*10+sw*0.8,y+13.3,0.7); g.fill(); }
}

// ---------- ombre delle nuvole sull'erba ----------
const CLOUDS=Array.from({length:4},(_,i)=>({x0:i*190+rand(0,80),y:rand(20,VH-20),r:rand(80,140),s:rand(7,13),sq:rand(0.45,0.7)}));
function drawClouds(g){
 if(room.w!=='ow'||room.dark>0.35) return;
 g.save(); g.globalCompositeOperation='multiply';
 for(const c of CLOUDS){ const span=VW+c.r*2; const x=((c.x0+T*c.s)%span+span)%span-c.r; const y=c.y+Math.sin(T*0.1+c.x0)*10;
  g.save(); g.translate(x,y); g.scale(1,c.sq); const gr=g.createRadialGradient(0,0,0,0,0,c.r); gr.addColorStop(0,'rgba(120,110,170,.20)'); gr.addColorStop(0.6,'rgba(130,120,180,.10)'); gr.addColorStop(1,'rgba(130,120,180,0)'); g.fillStyle=gr; circ(g,0,0,c.r); g.fill(); g.restore(); }
 g.restore();
}
