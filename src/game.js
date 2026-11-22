// ===================== GIOCATORE =====================
const HERO={skin:'#f6cfa4',hair:'#6b3a22',hairStyle:'spiky',body:'#2f9a86',collar:'#bfeee0',belt:'#6d4727',scarf:'#f08a3a',hat:'cap',hatc:'#2b5a4f',pants:'#4a3a30',boots:'#7a4a28'};

function updatePlayer(dt){
 P.inv=Math.max(0,P.inv-dt); P.bellCd-=dt; P.fireCd-=dt; P.warpCd-=dt;
 if(P.falling>0){ P.falling-=dt; if(P.falling<=0){ P.x=P.lastSafe.x; P.y=P.lastSafe.y; P.vx=P.vy=0; P.inv=0; hurtPlayer(1,P.x,P.y-1); P.kbx=P.kby=0; } return; }
 if(P.hook){ updateHook(dt); if(P.hook&&P.hook.state==='pull') return; }
 if(S.konami&&Math.random()<0.5&&(Math.abs(P.vx)+Math.abs(P.vy)>20)) addPart({x:P.x+rand(-4,4),y:P.y-6,vx:0,vy:-6,life:0.7,col:`hsl(${(T*240)%360},100%,70%)`,size:3,type:'spark'});

 // azioni
 if(IN.aP&&!P.hook){ P.aFromPlay=true; if(!tryInteract()&&S.items.pertica) startSwing(); }
 if(IN.a&&P.aFromPlay&&P.swing<=0&&P.spin<=0&&S.items.pertica&&!P.hook){ P.charge+=dt; if(P.charge>0.55&&!P.charged){ P.charged=true; AU.sfx('charge'); burst(P.x,P.y-16,['#fff','#ffe08a'],8,60,2,'spark'); } }
 if(IN.aR){ if(P.charged) startSpin(); P.charge=0; P.charged=false; P.aFromPlay=false; }
 if(IN.bP&&!P.hook&&P.swing<=0) useItem();
 if(IN.cP) cycleItem();

 // movimento
 let mx=IN.x, my=IN.y; if(P.hook||P.spin>0) { mx*=0; my*=0; }
 const under=tileAt(Math.floor(P.x/TS),Math.floor((P.y-2)/TS));
 let sp=122*(under==='w'?0.6:1)*(P.swing>0?0.3:1)*(P.charged?0.55:1);
 const k=1-Math.exp(-dt*16);
 P.vx=lerp(P.vx,mx*sp,k); P.vy=lerp(P.vy,my*sp,k);
 if((Math.abs(mx)>0.25||Math.abs(my)>0.25)&&P.swing<=0&&!P.charged){ P.face=Math.abs(mx)>Math.abs(my)*1.05?(mx>0?'r':'l'):(my>0?'d':'u'); [P.fx,P.fy]=FV[P.face]; }
 const ign=new Set(); { const a=Math.floor((P.x-7)/TS),b=Math.floor((P.x+6.99)/TS),c=Math.floor((P.y-6)/TS),d=Math.floor((P.y+2.99)/TS); for(let y=c;y<=d;y++) for(let x=a;x<=b;x++) ign.add(x+','+y); }
 const r=moveBox(P,(P.vx+P.kbx)*dt,(P.vy+P.kby)*dt,solidP,7,6,3,true,ign);
 P.kbx*=Math.exp(-dt*9); P.kby*=Math.exp(-dt*9);
 const spd=Math.hypot(P.vx,P.vy); P.walk+=spd*dt*0.13; P.moving=spd>15;
 if(P.moving&&under==='w'&&Math.random()<0.15) addPart({x:P.x,y:P.y,vx:0,vy:0,life:0.6,col:'rgba(200,240,255,.6)',size:4,type:'ripple'});
 if(P.moving&&Math.random()<0.04&&room.w==='ow') addPart({x:P.x+rand(-4,4),y:P.y,vx:rand(-10,10),vy:-8,life:0.4,col:'rgba(220,200,160,.5)',size:3,type:'smoke'});

 // porte e blocchi
 const hit=r.hitX||r.hitY;
 if(hit){ const c=tileAt(hit.tx,hit.ty);
  if(c==='D') tryUnlock(hit.tx,hit.ty);
  const b=blockAt(hit.tx,hit.ty);
  if(b&&b.t<=0&&(Math.abs(mx)>0.6||Math.abs(my)>0.6)){ P.push+=dt; if(P.push>0.3){ P.push=0; tryPush(b); } } else P.push=0;
  if(c==='M'&&S.flames<3&&!P.mTold){ P.mTold=1; say(['Un sigillo di luce viola sbarra la strada. Tre incavi vuoti attendono qualcosa.',`Fiamme: ${S.flames}/3.`]); }
 } else P.push=0;

 // cambi stanza
 if(P.x<0) return startTransition(-1,0);
 if(P.x>VW) return startTransition(1,0);
 if(P.y-4<0) return startTransition(0,-1);
 if(P.y>VH) return startTransition(0,1);

 // buche
 const ftx=Math.floor(P.x/TS), fty=Math.floor((P.y-2)/TS), ft=tileAt(ftx,fty);
 if(ft==='G'){ P.falling=0.55; AU.sfx('fall'); S.stats.falls++; if(S.stats.falls>=8) award('caduta'); return; }
 else if(ft&&ft!=='E'){ // ultima posizione sicura: centro della mattonella, lontano dai bordi delle buche
  let nearPit=false; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if(tileAt(ftx+dx,fty+dy)==='G') nearPit=true;
  if(!nearPit) P.lastSafe={x:ftx*TS+16,y:fty*TS+22};
  else if(!P.lastSafe) P.lastSafe={x:P.x,y:P.y};
 }
 // portali
 if(ft==='E'&&P.warpCd<=0){ const wi=room.idx.E[ftx+','+fty]; const wp=room.def.warps&&room.def.warps[wi]; if(wp){
   if(wp.lock==='torches'&&room.grid.some(r=>r.includes('X'))){ if(!P.lockTold){ P.lockTold=1; say(['La porta è sigillata. Le due torce ai lati sono spente...']); } P.y+=4; }
   else warpTo(wp.to,wp.x,wp.y); } }
 // spada
 if(P.swing>0){ P.swing-=dt; const prog=1-P.swing/0.24; if(prog>0.1&&prog<0.85) swordHits(P.x+P.fx*20,P.y-10+P.fy*18,17,'sword'); }
 if(P.spin>0){ P.spin-=dt; swordHits(P.x,P.y-10,36,'spin'); if(Math.random()<0.6){ const a=rand(0,6.28); addPart({x:P.x+Math.cos(a)*30,y:P.y-10+Math.sin(a)*24,vx:-Math.sin(a)*80,vy:Math.cos(a)*80,life:0.3,col:'#ffd27a',size:2,type:'spark'}); } }
 // raccolta
 for(const e of ents){ if(['shell','heart','firefly','piece','page','keyp','container','flame'].includes(e.kind)&&!e.dead&&dist(e.x,e.y-6,P.x,P.y-8)<e.r+10&&!(e.z>2)) collect(e);
  if(e.kind==='portal'&&dist(e.x,e.y,P.x,P.y)<16&&P.warpCd<=0){ warpTo(e.to.to,e.to.x,e.to.y); } }
}
function startSwing(){ P.swing=0.24; P.swingId++; AU.sfx('swing'); P.charge=0; P.sqk=(P.sqk||0)-0.1; }
function startSpin(){ P.spin=0.42; P.swingId++; AU.sfx('spin'); S.stats.spins++; if(S.stats.spins>=25) award('turbine'); P.charged=false; }
function swordHits(cx,cy,r,type){
 const src={type,x:P.x,y:P.y-8,id:P.swingId};
 for(const e of ents){ if(e.dead) continue;
  if(e.enemy&&e.hitId!==P.swingId&&dist(e.x,e.y-10-(e.z||0)*0.5,cx,cy)<r+e.r){ e.hitId=P.swingId; if(!(EDEF[e.kind].fly&&e.z>45)) hitEnemy(e,type==='spin'?2:1,src); }
  if(e.kind==='frog'&&e.hitId!==P.swingId&&dist(e.x,e.y-8,cx,cy)<r+8){ e.hitId=P.swingId; frogSing(e); }
  if(e.kind==='cat'&&e.hitId!==P.swingId&&dist(e.x,e.y-8,cx,cy)<r+8){ e.hitId=P.swingId; AU.sfx('meow'); floatText(e.x,e.y-30,'Fffff!','#ffd34d'); e.face=e.face==='l'?'r':'l'; }
  if(['shell','heart','firefly','piece','page','keyp'].includes(e.kind)&&dist(e.x,e.y-8,cx,cy)<r+6) collect(e);
 }
 for(const p of projs) if(p.hostile&&dist(p.x,p.y,cx,cy)<r+4){ p.life=0; burst(p.x,p.y,['#fff','#e0c0ff'],6,80,2,'spark'); AU.sfx('clink'); }
 // cespugli
 const pts=type==='spin'?[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]].map(([a,b])=>[cx+a*24,cy+b*22]):[[cx,cy],[cx+P.fy*10,cy+P.fx*10],[cx-P.fy*10,cy-P.fx*10]];
 for(const [x,y] of pts){ const tx=Math.floor(x/TS), ty=Math.floor(y/TS); if(tileAt(tx,ty)==='B') cutBush(tx,ty); }
}
function cutBush(tx,ty){
 setTile(tx,ty,room.floor==='S'?'S':(room.w==='ow'?'.':room.floor)); AU.sfx('cut'); S.stats.bushes++; if(S.stats.bushes>=40) award('giardiniere');
 for(let i=0;i<12;i++) addPart({x:tx*TS+16+rand(-8,8),y:ty*TS+16+rand(-8,8),vx:rand(-90,90),vy:rand(-120,-20),life:rand(0.5,0.9),col:pick(['#3f8a3c','#55a84b','#7cc565']),size:rand(2,4),type:'leaf',g:260});
 const r=Math.random(); if(r<0.28) ents.push(mkEnt('shell',tx*TS+16,ty*TS+22,{val:r<0.04?5:1})); else if(r<0.42&&S.hp<S.maxhp) ents.push(mkEnt('heart',tx*TS+16,ty*TS+22));
}
function tryUnlock(tx,ty){
 if((S.keys[room.w]||0)<=0){ if(!P.doorTold){ P.doorTold=1; floatText(P.x,P.y-44,'Serve una piccola chiave','#ffe08a'); } return; }
 S.keys[room.w]--; AU.sfx('door'); shake=4;
 const q=[[tx,ty]]; while(q.length){ const [x,y]=q.pop(); if(tileAt(x,y)!=='D') continue; setTile(x,y,room.floor); S.got[gk('D',x,y)]=1; burst(x*TS+16,y*TS+16,['#c9a24a','#7a4f2c'],10,100,3); q.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]); }
 save();
}
function tryPush(b){
 const dx=Math.abs(P.vx)>Math.abs(P.vy)?Math.sign(P.vx):0, dy=dx?0:Math.sign(P.vy); if(!dx&&!dy) return;
 if(room.plates.some(p=>p.x===b.x&&p.y===b.y)){ AU.tone(120,0.08,'square',0.04); return; }
 const nx=b.x+dx, ny=b.y+dy, c=tileAt(nx,ny);
 if(c===null||!(c===room.floor||c==='p'||c==='_'||c==='.')||blockAt(nx,ny)||ents.some(e=>e.enemy&&Math.floor(e.x/TS)===nx&&Math.floor((e.y-4)/TS)===ny)) { AU.tone(120,0.08,'square',0.04); return; }
 b.x=nx; b.y=ny; b.dx=dx; b.dy=dy; b.t=0.22; AU.sfx('push');
}

// ---------- oggetti ----------
const ITEM_ORDER=['lanterna','rampino','campana'];
function cycleItem(){ const own=ITEM_ORDER.filter(i=>S.items[i]); if(own.length<2) return; const i=own.indexOf(S.sel); S.sel=own[(i+1)%own.length]; AU.sfx('menu'); hudSelFlash=1.4; }
function useItem(){
 const it=S.sel; if(!it||!S.items[it]){ if(!P.noItemTold){ P.noItemTold=1; pipSay('Non hai ancora nessun oggetto per il tasto B!'); } return; }
 if(it==='lanterna'){ if(P.fireCd>0) return; P.fireCd=0.45; AU.sfx('fire'); projs.push({k:'fire',x:P.x+P.fx*12,y:P.y-12+P.fy*10,vx:P.fx*250,vy:P.fy*250,life:0.48,friendly:1,id:'f'+Math.random()}); }
 if(it==='rampino'){ P.hook={x:P.x+P.fx*8,y:P.y-10+P.fy*6,dx:P.fx,dy:P.fy,d:0,state:'out',carry:null}; AU.sfx('hook'); P.vx=P.vy=0; }
 if(it==='campana'){ if(P.bellCd>0) return; P.bellCd=0.9; ringBell(); }
}
function ringBell(){
 const R=118, cx=P.x, cy=P.y-10; AU.sfx('bell'); shake=Math.max(shake,2); rings.push({x:cx,y:cy,r:0,max:R,life:0.6});
 for(let ty=0;ty<CH;ty++) for(let tx=0;tx<CW;tx++){ if(room.grid[ty][tx]==='Z'&&dist(tx*TS+16,ty*TS+16,cx,cy)<R+10) setTimeout(()=>shatterTile(tx,ty),dist(tx*TS+16,ty*TS+16,cx,cy)*2.2); }
 if(room.grid.some(r=>r.includes('[')||r.includes(']'))){ room.crystal^=1; setTimeout(()=>AU.tone(room.crystal?988:659,0.3,'triangle',0.08),120); }
 for(const e of ents) if(e.enemy&&!e.dead&&dist(e.x,e.y-10,cx,cy)<R+e.r) stunEnemy(e,3);
}
function updateHook(dt){
 const h=P.hook, SP=560;
 if(h.state==='out'){
  let steps=Math.ceil(SP*dt/6);
  for(let i=0;i<steps;i++){ h.x+=h.dx*6; h.y+=h.dy*6; h.d+=6;
   const tx=Math.floor(h.x/TS), ty=Math.floor((h.y+4)/TS), c=tileAt(tx,ty);
   if(c==='O'){ const lx=tx-h.dx, ly=ty-h.dy; h.state='pull'; h.tx=lx*TS+16; h.ty=ly*TS+22; h.x=tx*TS+16; h.y=ty*TS+8; AU.sfx('clink'); burst(h.x,h.y,['#fff','#ffe08a'],6,60,2,'spark'); return; }
   if(solidProj(tx,ty)){ h.state='back'; AU.sfx('clink'); burst(h.x,h.y,['#fff'],5,60,2,'spark'); break; }
   let stop=false;
   for(const e of ents){ if(e.dead) continue; const ez=e.z||0;
    if(e.enemy&&dist(e.x,e.y-10-ez,h.x,h.y)<e.r+6){ const d=EDEF[e.kind]; if(d.onHook){ d.onHook(e); } else stunEnemy(e,2.5); h.state='back'; stop=true; break; }
    if(['shell','heart','firefly','piece','page','keyp'].includes(e.kind)&&dist(e.x,e.y-8,h.x,h.y)<14){ h.carry=e; h.state='back'; stop=true; break; } }
   if(stop) break;
   if(h.d>=7*TS){ h.state='back'; break; }
  }
 } else if(h.state==='back'){
  const tx=P.x, ty=P.y-10, a=Math.atan2(ty-h.y,tx-h.x); h.x+=Math.cos(a)*SP*1.2*dt; h.y+=Math.sin(a)*SP*1.2*dt;
  if(h.carry){ h.carry.x=h.x; h.carry.y=h.y+8; }
  if(dist(h.x,h.y,tx,ty)<14){ if(h.carry) collect(h.carry); P.hook=null; }
 } else if(h.state==='pull'){
  const a=Math.atan2(h.ty-P.y,h.tx-P.x), d=dist(P.x,P.y,h.tx,h.ty), s=Math.min(d,420*dt);
  P.x+=Math.cos(a)*s; P.y+=Math.sin(a)*s; P.vx=P.vy=0;
  if(Math.random()<0.5) addPart({x:P.x,y:P.y-10,vx:0,vy:0,life:0.3,col:'rgba(255,255,255,.5)',size:3,type:'spark'});
  if(d<2){ P.x=h.tx; P.y=h.ty; P.hook=null; P.lastSafe={x:P.x,y:P.y}; P.sqk=0.16; burst(P.x,P.y,['rgba(220,200,160,.8)'],6,50,3,'smoke'); }
 }
}

// ---------- interazioni ----------
function tryInteract(){
 const fx=P.x+P.fx*16, fy=P.y-8+P.fy*16;
 for(const e of ents){ if(e.dead) continue;
  if((e.kind==='npc'||e.kind==='cat')&&dist(e.x,e.y-8,fx,fy)<24){
   if(e.kind==='cat'){ say(talkCat()); return true; }
   e.face=faceOf(P.x-e.x,P.y-e.y); say(NPC[e.id].talk()); return true; }
  if(e.kind==='frog'&&dist(e.x,e.y-8,fx,fy)<20){ frogSing(e); return true; }
 }
 const tx=Math.floor((P.x+P.fx*20)/TS), ty=Math.floor((P.y-4+P.fy*18)/TS), c=tileAt(tx,ty);
 if(c==='s'){ say([room.def.signs[room.idx.s[tx+','+ty]]]); return true; }
 if(c==='g'){ const i=room.idx.g[tx+','+ty]; const txt=(room.def.graves||[])[i]||'La lapide è troppo consumata per leggerla.'; S.stats.graves[room.key+i]=1;
   if(room.key==='ow:3,1'&&Object.keys(S.stats.graves).filter(k=>k.startsWith('ow:3,1')).length>=14) award('becchino');
   say(['La lapide dice: «'+txt+'»']); return true; }
 if(c==='C'&&!S.got[gk('C',tx,ty)]&&(P.face==='u'||P.face==='l'||P.face==='r'||P.face==='d')){ openChest(tx,ty); return true; }
 if(c==='L'){ say(S.flames>=3?['La Grande Lanterna arde con tutte e tre le Fiamme. La notte trattiene il respiro.']:[`La Grande Lanterna di Brumafonda. Fiamme accese: ${S.flames}/3.`, S.flames?'Pip: Si sta riprendendo! Continuiamo così.':'Pip: È fredda. Sembra quasi... triste.']); return true; }
 return false;
}
function openChest(tx,ty){
 S.got[gk('C',tx,ty)]=1; AU.sfx('chest'); burst(tx*TS+16,ty*TS+12,['#ffe08a','#fff'],14,100,2.5,'spark');
 const ci=room.idx.C[tx+','+ty], c=room.def.chests[ci];
 if(c.item) setTimeout(()=>giveItem(c.item),250);
 else if(c.key){ S.keys[room.w]=(S.keys[room.w]||0)+1; P.hold='key'; say(['Hai trovato una piccola chiave!','Apre una porta chiusa di questo luogo.'],()=>P.hold=null); }
 save();
}

// ---------- dialoghi ----------
function say(lines,onEnd){ dlg={lines:lines.slice(),i:-1,ch:0,onEnd,cur:null}; mode='dialog'; nextLine(); }
function nextLine(){
 dlg.i++; while(dlg.i<dlg.lines.length&&dlg.lines[dlg.i].fn){ dlg.lines[dlg.i].fn(); dlg.i++; if(mode!=='dialog') return; }
 if(dlg.i>=dlg.lines.length){ const cb=dlg.onEnd; dlg=null; if(mode==='dialog') mode='play'; P&&(P.charge=0,P.charged=false,P.aFromPlay=false); cb&&cb(); return; }
 let L=dlg.lines[dlg.i]; let paper=false; if(typeof L==='object'){ paper=L.paper; L=L.text; }
 let who=null, text=L; const m=/^([A-ZÀ-Ú][\wÀ-ú' ]{1,22}): (.*)$/s.exec(L); if(m&&!paper){ who=m[1]; text=m[2]; }
 dlg.cur={who,text,paper}; dlg.ch=0;
}
function updateDialog(dt){
 if(!dlg) { mode='play'; return; }
 const len=dlg.cur.text.length, prev=dlg.ch|0; dlg.ch=Math.min(len,dlg.ch+dt*62);
 if((dlg.ch|0)!==prev&&(dlg.ch|0)%3===0&&dlg.ch<len) AU.sfx('talk');
 if(IN.aP||IN.tapAdv||IN.bP){ IN.tapAdv=0; if(dlg.ch<len) dlg.ch=len; else { AU.sfx('text'); nextLine(); } }
}

// ---------- transizioni ----------
function startTransition(dx,dy){
 const nk=neighborKey(dx,dy);
 if(nk&&!S.flags.intro){ P.x=clamp(P.x,4,VW-4); P.y=clamp(P.y,10,VH-2); P.vx=P.vy=0; if(!pipMsg) pipSay('Aspetta! Prima andiamo da Nonna Orsola, quella vestita di viola.'); return; }
 if(!nk){ P.x=clamp(P.x,1,VW-1); P.y=clamp(P.y,5,VH); return; }
 snapCv.getContext('2d').drawImage(cv,0,0);
 S.rx+=dx; S.ry+=dy; P.hook=null; P.swing=0; P.spin=0;
 if(dx===1) P.x=2; if(dx===-1) P.x=VW-2; if(dy===1) P.y=8; if(dy===-1) P.y=VH-2;
 enterRoom(nk); trans={dx,dy,t:0}; mode='trans';
}
function enterRoom(k){
 const prevName=room&&room.def.name; loadRoom(k); roomEntry={x:P.x,y:P.y}; P.lastSafe={x:P.x,y:P.y};
 const def=room.def; AU.setMusic(def.boss&&!S.got[room.bossKey]?def.music:(def.boss?'dungeon':def.music));
 if(def.name!==prevName&&!def.boss) banner={text:def.name,t:2.6};
 if(!def.boss) bossRef=null;
 S.px=P.x; S.py=P.y; save();
 if(k==='fn:0,0'&&!S.got[room.bossKey]&&!S.flags.falenaTalk){ S.flags.falenaTalk=1; setTimeout(()=>say(['Cenerale: Un altro lampionaio. Sei venuto a spegnermi?','Pip: Ilio non parla molto. Ma quando lo fa, di solito picchia.','Cenerale: Le Fiamme erano MIE. Le avevo chiuse al sicuro, dove il buio non poteva prenderle!','Cenerale: Fuori di qui c\'è solo il buio... e io non tornerò al buio!']),400); }
}
function warpTo(to,x,y){ if(fade) return; AU.sfx('warp'); fade={t:0,to,x,y}; mode='warp'; }
function updateWarp(dt){
 fade.t+=dt;
 if(fade.t>=0.35&&!fade.done){ fade.done=true; const [w,xy]=fade.to.split(':'); const [rx,ry]=xy.split(',').map(Number); S.world=w; S.rx=rx; S.ry=ry; P.x=fade.x*TS+16; P.y=fade.y*TS+22; P.face='d'; P.fx=0; P.fy=1; P.warpCd=0.6; P.hook=null; room=null; enterRoom(fade.to); }
 if(fade.t>=0.7){ fade=null; mode='play'; }
}

// ===================== AGGIORNAMENTO =====================
function update(dt){
 T+=dt; if(S) S.stats.time+=dt;
 if(IN.tmClick){ IN.tmClick=0; if(mode==='play') openMenu(); else if(menuOpen) closeMenu(); }
 if(IN.mP){ if(mode==='play') openMenu(); else if(menuOpen) closeMenu(); else if(shopOpen) closeShop(); }
 if(IN.tpClick||IN.pP){ IN.tpClick=0; if(mode==='play') say(pipHint()); }
 if(mode==='title'||mode==='menu'||mode==='shop') return;
 if(mode==='dialog'){ updateDialog(dt); updateFx(dt); return; }
 if(mode==='trans'){ trans.t+=dt; if(trans.t>=0.5){ trans=null; mode='play'; } return; }
 if(mode==='warp'){ updateWarp(dt); return; }
 if(mode==='dead'){ deadT+=dt; updateFx(dt); if(deadT>2.2&&(IN.aP||IN.tapAdv||deadT>5)){ IN.tapAdv=0; S.hp=S.maxhp; P.inv=1.5; mode='play'; const k=room.key; P.x=roomEntry.x; P.y=roomEntry.y; loadRoom(k); P.hook=null; } return; }
 if(mode==='ending'){ updateEnding(dt); return; }
 if(hitstop>0){ hitstop-=dt; return; }
 updatePlayer(dt); if(mode!=='play') return;
 for(const e of ents){ if(e.dead) continue; const d=EDEF[e.kind]; e.t+=dt; e.inv=Math.max(0,e.inv-dt); e.stun=Math.max(0,e.stun-dt);
  if(d.update) d.update(e,dt);
  if(e.kbx||e.kby){ moveBox(e,e.kbx*dt,e.kby*dt,d.fly?solidF:solidE,Math.max(4,e.r-4),Math.max(4,e.r-4),2); e.kbx*=Math.exp(-dt*10); e.kby*=Math.exp(-dt*10); if(Math.abs(e.kbx)+Math.abs(e.kby)<5) e.kbx=e.kby=0; }
  if(e.enemy){ const can=d.harm?d.harm(e):e.stun<=0; if(can&&P.falling<=0&&dist(e.x,e.y-(e.z||0)*0.3,P.x,P.y-4)<e.r+8) hurtPlayer(e.boss?2:1,e.x,e.y); }
 }
 ents=ents.filter(e=>!e.dead);
 updateProjs(dt); updateRoomLogic(dt); updateFx(dt); updatePip(dt);
 if(S.flags.intro===undefined&&!S.flags.introShown){ S.flags.introShown=1; }
 if(bossRef&&bossRef.dead) bossRef=null;
}
function updateProjs(dt){
 for(const p of projs){
  p.life-=dt; p.x+=p.vx*dt; p.y+=p.vy*dt;
  const tx=Math.floor(p.x/TS), ty=Math.floor((p.y+6)/TS), c=tileAt(tx,ty);
  if(p.k==='fire'){
   if(Math.random()<0.8) addPart({x:p.x+rand(-3,3),y:p.y+rand(-3,3),vx:rand(-20,20),vy:rand(-30,0),life:0.35,col:pick(['#ffcf6b','#ff8a3c','#fff2b0']),size:rand(2,4),type:'ember'});
   if(c==='V'){ burnTile(tx,ty); p.life=0; }
   else if(c==='X'){ lightTorch(tx,ty); p.life=0; }
   else if(solidProj(tx,ty)){ p.life=0; burst(p.x,p.y,['#ffcf6b','#ff8a3c'],8,80,2,'ember'); }
   for(const e of ents) if(e.enemy&&!e.dead&&dist(e.x,e.y-10-(e.z||0),p.x,p.y)<e.r+8){ hitEnemy(e,1,{type:'fire',x:p.x-p.vx*0.05,y:p.y-p.vy*0.05,id:p.id}); p.life=0; break; }
   for(const e of ents) if(e.kind==='velo'&&dist(e.x,e.y,p.x,p.y)<90) e.rev=Math.max(e.rev,1.5);
   if(p.life<=0) burst(p.x,p.y,['#ffcf6b','#ff8a3c'],6,60,2,'ember');
  } else if(p.hostile){
   if(c!==null&&solidF(tx,ty)&&!'WG'.includes(c)) { p.life=0; burst(p.x,p.y,['#e0c0ff'],5,50,2); }
   if(c===null) p.life=0;
   if(P.falling<=0&&dist(p.x,p.y,P.x,P.y-10)<11){ hurtPlayer(p.dmg||1,p.x,p.y); p.life=0; }
  }
 }
 projs=projs.filter(p=>p.life>0);
}
function updateFx(dt){
 for(const p of parts){ p.life-=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; if(p.g) p.vy+=p.g*dt; if(p.type==='leaf'||p.type==='glass'){ p.vx*=0.98; } if(p.type==='ember'||p.type==='smoke') { p.vx*=0.96; p.vy*=0.97; } }
 parts=parts.filter(p=>p.life>0);
 for(const f of floaters){ f.life-=dt; f.y-=dt*22; } floaters=floaters.filter(f=>f.life>0);
 for(const r of rings){ r.life-=dt; r.r=r.max*easeOut(1-r.life/0.6); } rings=rings.filter(r=>r.life>0);
 shake=Math.max(0,shake-dt*30);
 if(banner){ banner.t-=dt; if(banner.t<=0) banner=null; }
 if(pipMsg){ pipMsg.life-=dt; if(pipMsg.life<=0) pipMsg=null; }
 if(toastQ.length){ toastQ[0].life-=dt; if(toastQ[0].life<=0) toastQ.shift(); }
 // particelle ambientali
 if(room){ const w=room.w;
  if(w==='ow'&&Math.random()<0.05&&room.dark<0.4) addPart({x:rand(0,VW),y:-4,vx:rand(10,30),vy:rand(15,30),life:8,col:pick(['#ffd0e0','#fff2c0','#d9f0b0']),size:2.5,type:'petal'});
  if((room.dark>=0.3||w==='d1')&&Math.random()<0.05) addPart({x:rand(0,VW),y:rand(0,VH),vx:rand(-8,8),vy:rand(-8,-2),life:rand(2,4),col:w==='d1'?'#d6a8ff':'#eaff8a',size:1.6,type:'mote'});
  if(w==='d2'&&Math.random()<0.06) addPart({x:rand(0,VW),y:VH+4,vx:rand(-5,5),vy:rand(-25,-12),life:6,col:'rgba(200,240,255,.5)',size:rand(2,4),type:'bubble'});
  if(w==='d3'&&Math.random()<0.05) addPart({x:rand(0,VW),y:rand(0,VH),vx:rand(3,8),vy:rand(2,6),life:4,col:'rgba(255,230,180,.5)',size:1.4,type:'mote'});
  if(w==='fn'&&Math.random()<0.08) addPart({x:rand(0,VW),y:-4,vx:rand(-10,10),vy:rand(12,22),life:9,col:'rgba(190,180,200,.6)',size:2,type:'ash'});
 }
}
function updatePip(dt){
 if(!pip) pip={x:P.x,y:P.y-30,vx:0,vy:0,idle:rand(40,70)};
 const side=P.fx!==0?-P.fx:1; const tx=P.x+side*22+Math.sin(T*1.3)*6, ty=P.y-50+Math.sin(T*2.1)*5;
 pip.vx+=(tx-pip.x)*dt*14; pip.vy+=(ty-pip.y)*dt*14; pip.vx*=Math.exp(-dt*5); pip.vy*=Math.exp(-dt*5); pip.x+=pip.vx*dt; pip.y+=pip.vy*dt;
 if(Math.random()<0.15) addPart({x:pip.x+rand(-2,2),y:pip.y+2,vx:rand(-6,6),vy:rand(4,12),life:0.6,col:S.konami?`hsl(${(T*200)%360},100%,70%)`:'#eaff8a',size:1.4,type:'spark'});
 pip.idle-=dt; if(pip.idle<=0){ pip.idle=rand(60,110); if(S.flags.intro) pipSay(pick(PIP_IDLE)); }
}

// ===================== FINALE =====================
let END=null;
function startEnding(){
 S.flags.done=1; award('fine'); save();
 const tru=S.fireflies>=TOTAL_FIREFLIES;
 const lines=tru?[
  'Cenerale cade a terra. Le sue ali tremano come foglie secche.',
  {fn:()=>{ for(let i=0;i<24;i++) setTimeout(()=>{ ents.push(mkEnt('firefly',P.x+rand(-150,150),P.y+rand(-120,40),{gid:'end'+i,deco:1})); AU.tone(880*2**(((rand(0,12))|0)/12),0.3,'sine',0.05); },i*80); }},
  'Le ventiquattro lucciole che hai ritrovato si alzano dal tuo zaino e gli volano intorno, piano.',
  'Cenerale: Così... tante luci. E nessuna chiusa in una stanza.',
  'Pip: Non devi tenerla stretta, la luce. Basta stare vicini.',
  'Una voce lontana, che sa di pane e di fumo: «Torna a casa, piccolo.»',
  'La cenere scivola via dalle sue ali. Sotto, c\'è una lucciola minuscola, un po\' spaventata.',
  'Cenerale: ...posso venire con voi?'
 ]:[
  'Cenerale cade a terra. Le sue ali si sbriciolano in cenere grigia.',
  'Cenerale: Fa... così buio...',
  'Le tre Fiamme si alzano in volo verso Brumafonda.',
  'Pip: Ilio... mi sembra che mancasse qualcosa. Se avessimo ritrovato tutte le lucciole, forse...'
 ];
 say(lines,()=>{ mode='ending'; END={t:0,tru,scroll:0}; AU.setMusic('title'); });
}
function updateEnding(dt){ END.t+=dt; if(END.t>4&&(IN.aP||IN.tapAdv)){ IN.tapAdv=0; if(END.t<END.minT) return; mode='title'; END=null; showTitle(); } }
