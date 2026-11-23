// ===================== GUIDA: OBIETTIVI, FRECCIA, DIARIO DELLE MISSIONI =====================
const QUESTS=[
 {id:'intro', t:'Parla con Nonna Orsola', done:()=>S.flags.intro},
 {id:'lanterna', t:'Trova la Lanterna nella Tana del Fungo', done:()=>S.items.lanterna},
 {id:'flame0', t:'Sconfiggi la Madre Muffa: Fiamma del Bosco', done:()=>S.flags.flame0},
 {id:'rampino', t:'Trova il Rampino nel Faro Sommerso', done:()=>S.items.rampino},
 {id:'flame1', t:'Sconfiggi l\'Anguilla di Rame: Fiamma del Mare', done:()=>S.flags.flame1},
 {id:'campana', t:'Trova la Campana di Vetro nel Campanile', done:()=>S.items.campana},
 {id:'flame2', t:'Sconfiggi il Gufo d\'Ottone: Fiamma del Vento', done:()=>S.flags.flame2},
 {id:'stivali', t:'Trova gli Stivali di Piuma nella Serra di Vetro', done:()=>S.items.stivali},
 {id:'regina', t:'Sconfiggi la Regina Rovo: Corolla di Luce', done:()=>S.flags.regina},
 {id:'done', t:'Affronta Cenerale nel Nido della Falena', done:()=>S.flags.done}
];
function curObjective(){
 const it=S.items, f=S.flags, w=room?room.w:'ow';
 if(!f.intro) return {t:'Parla con Nonna Orsola, la signora vestita di viola',room:'ow:1,2',tile:[3,3]};
 if(!f.flame0){
  if(w==='d1') return {t:!it.lanterna?'Tana del Fungo: sconfiggi i Muffoli nella stanza a est, poi prosegui a nord':'Tana del Fungo: accendi le 4 torce nella stanza buia a ovest, prendi la chiave e brucia i rovi a nord'};
  return it.lanterna?{t:'Torna nella Tana del Fungo e sconfiggi la Madre Muffa',room:'ow:0,1',tile:[7,1]}:{t:'Raggiungi la Tana del Fungo, nel Bosco Muschiato a nord-ovest',room:'ow:0,1',tile:[7,1]};
 }
 if(!f.flame1){
  if(w==='d2') return {t:!it.rampino?'Faro Sommerso: sconfiggi i granchi nella stanza a ovest':'Faro Sommerso: col rampino prendi la chiave a est, poi sali a nord dall\'Anguilla'};
  return it.rampino?{t:'Torna nel Faro Sommerso e sconfiggi l\'Anguilla di Rame',room:'ow:3,3',tile:[13,4]}:{t:'Brucia i rovi con la lanterna (tasto B) e raggiungi il Faro Sommerso a sud-est',room:'ow:3,3',tile:[13,4]};
 }
 if(!f.flame2){
  if(w==='d3') return {t:!it.campana?'Campanile: spingi i due blocchi sulle piastre nella stanza a ovest':'Campanile: suona la campana per rompere la parete a est e scambiare i cristalli, poi sali'};
  return it.campana?{t:'Torna nel Campanile e sconfiggi il Gufo d\'Ottone',room:'ow:2,0',tile:[7,3]}:{t:'Attraversa l\'Abisso del Vento col rampino e accendi le due torce del Campanile',room:'ow:2,0',tile:[7,3]};
 }
 if(!it.stivali||!f.regina){
  if(w==='d4') return {t:!it.stivali?'Serra di Vetro: brucia i rovi nella stanza a ovest e sconfiggi gli Spinarelli':'Serra di Vetro: salta le buche a est per la chiave, poi accendi le 4 torce oltre la porta a nord'};
  if(room&&room.key==='ow:0,1'&&tileAt(12,1)==='Z') return {t:'Rompi con la campana le rocce incrinate in alto a destra del Bosco Muschiato',room:'ow:0,1',tile:[12,1]};
  return {t:!it.stivali?'Raggiungi la Serra di Vetro sull\'Altopiano dei Venti, a nord del Bosco Muschiato':'Torna nella Serra di Vetro e sconfiggi la Regina Rovo',room:'ow:0,0',tile:[7,1]};
 }
 if(!f.done){
  if(w==='fn') return {t:'Nido della Falena: brucia i rovi, salta la crepa (Maiusc / ⤒), agganciati all\'anello e rompi la parete con la campana'};
  return {t:'Entra nel Nido della Falena, a est del Campanile',room:'ow:3,0',tile:[7,1]};
 }
 if(S.fireflies<TOTAL_FIREFLIES) return {t:`Ritrova i lumini mancanti (${S.fireflies}/${TOTAL_FIREFLIES}) per il finale vero`};
 return {t:'Hai completato tutto. Grazie per aver giocato!'};
}
// grafo delle stanze del mondo esterno (bordi percorribili)
const EDGE_WALK=c=>!'THRWBVFL#XYZQCsgOlmM[]KuG'.includes(c);
function roomStep(from,to){
 if(from===to) return null;
 const q=[from], prev={[from]:null};
 while(q.length){ const k=q.shift(); if(k===to) break; const [w,xy]=k.split(':'); const [x,y]=xy.split(',').map(Number); const m=ROOMS[k].map;
  const tryN=(dx,dy,ok)=>{ const n=w+':'+(x+dx)+','+(y+dy); if(ROOMS[n]&&ok&&!(n in prev)){ prev[n]=k; q.push(n); } };
  tryN(-1,0,m.some(r=>EDGE_WALK(r[0]))); tryN(1,0,m.some(r=>EDGE_WALK(r[15]))); tryN(0,-1,[...m[0]].some(EDGE_WALK)); tryN(0,1,[...m[10]].some(EDGE_WALK)); }
 if(!(to in prev)) return null;
 let k=to; while(prev[k]!==from) k=prev[k];
 const a=from.split(':')[1].split(',').map(Number), b=k.split(':')[1].split(',').map(Number); return [b[0]-a[0],b[1]-a[1]];
}
let guideSt={text:'',changed:0,lastHint:0};
function updateGuide(){
 if(!S||mode==='title') return;
 const o=curObjective();
 if(o.t!==guideSt.text){ const first=!guideSt.text; guideSt.text=o.t; guideSt.changed=T; guideSt.lastHint=T; guideSt.flash=first?0:3; if(!first){ AU.sfx('menu'); toast('★ Nuovo obiettivo'); } }
 if(mode==='play'&&!S.flags.noGuide&&T-guideSt.changed>140&&T-guideSt.lastHint>140&&!pipMsg){ guideSt.lastHint=T; pipSay('Ehi Ilio! '+o.t+'. Se serve, premi ✦ e ti spiego meglio.'); }
}
function drawGuideWorld(g){
 if(S.flags.noGuide||mode!=='play'&&mode!=='dialog') return;
 const o=curObjective(); if(!o.room) return;
 if(o.room===room.key&&o.tile){ const [tx,ty]=o.tile; const npc=ents.find(e=>e.kind==='npc'&&Math.floor(e.x/TS)===tx&&Math.floor((e.y-6)/TS)===ty);
  const x=tx*TS+16, y=(npc?npc.y-76:ty*TS-6)+Math.sin(T*4)*3; const pulse=1+Math.sin(T*6)*0.08;
  g.save(); g.translate(x,y); g.scale(pulse,pulse); g.fillStyle='rgba(255,224,138,.25)'; circ(g,0,0,13); g.fill();
  g.fillStyle='#ffe08a'; g.strokeStyle='#5a3a10'; g.lineWidth=1.5; g.beginPath(); g.moveTo(-7,-6); g.lineTo(7,-6); g.lineTo(0,5); g.closePath(); g.fill(); g.stroke(); g.restore(); return; }
 if(room.w!=='ow') return;
 const st=roomStep(room.key,o.room); if(!st) return;
 const [dx,dy]=st, m=room.def.map; let cells=[];
 if(dx) { const col=dx>0?15:0; for(let y=0;y<11;y++) if(EDGE_WALK(m[y][col])) cells.push(y); }
 else { const row=dy>0?10:0; for(let x=0;x<16;x++) if(EDGE_WALK(m[row][x])) cells.push(x); }
 if(!cells.length) return; const mid=(cells[0]+cells[cells.length-1])/2*TS+16;
 const b=Math.sin(T*5)*4; let x,y; if(dx){ x=dx>0?VW-16+b*0.5:16-b*0.5; y=mid; } else { x=mid; y=dy>0?VH-14+b*0.5:16-b*0.5; }
 const a=Math.atan2(dy,dx);
 g.save(); g.translate(x,y); g.rotate(a); g.globalAlpha=0.85+Math.sin(T*5)*0.15;
 const gr=g.createRadialGradient(0,0,0,0,0,20); gr.addColorStop(0,'rgba(255,230,150,.45)'); gr.addColorStop(1,'rgba(255,230,150,0)'); g.fillStyle=gr; circ(g,0,0,20); g.fill();
 g.fillStyle='#ffe08a'; g.strokeStyle='#5a3a10'; g.lineWidth=2; g.beginPath(); g.moveTo(10,0); g.lineTo(-6,-9); g.lineTo(-2,0); g.lineTo(-6,9); g.closePath(); g.fill(); g.stroke(); g.restore(); g.globalAlpha=1;
}
function drawObjectiveBar(g){
 if(S.flags.noGuide||(bossRef&&!bossRef.dead)||mode==='dialog') return;
 const fs=Math.round(clamp(12/Math.min(1,CSS_S),12,16)); g.font=`600 ${fs}px ${FONT}`;
 const lh=Math.round(fs*1.3), lines=wrap(g,guideSt.text,GW-70).slice(0,3);
 const w=Math.max(...lines.map(l=>g.measureText(l).width))+44, h=lines.length*lh+12, x=8, y=GH-h-8;
 const fl=guideSt.flash>0?(guideSt.flash-=1/60, 0.5+Math.abs(Math.sin(T*8))*0.5):0;
 g.globalAlpha=0.92; ffWin(g,x,y,w,h,6); g.globalAlpha=1;
 if(fl){ g.strokeStyle=`rgba(255,224,138,${fl})`; g.lineWidth=2.5; rr(g,x-1,y-1,w+2,h+2,7); g.stroke(); }
 g.textAlign='left'; ffText(g,'★',x+11,y+6+lh*0.78,'#ffe08a'); lines.forEach((l,i)=>ffText(g,l,x+30,y+6+lh*0.78+i*lh,'#ffffff'));
}

const SIDE_QUESTS=[
 {t:'La Torta della Luna (Lalla)', st:()=>S.flags.cakeDone?2:S.flags.cakeAsked?1:0, info:()=>{ const n=Object.keys(S.ingr||{}).length; return `Ingredienti: ${n}/3`; }},
 {t:'Il Coro del Lago (Prato delle Rane)', st:()=>S.flags.frogs?2:S.visited['ow:2,1']?1:0, info:()=>'Leggi il cartello vicino allo stagno'},
 {t:'Il segreto di Bricco (il gatto)', st:()=>S.trophies.gatto?2:S.stats.cat>0?1:0, info:()=>`Chiacchierate: ${Math.min(S.stats.cat,10)}/10`},
 {t:'Le pagine di Orsola (Strega Ortica)', st:()=>S.flags.ortica?2:S.pages.length>0?1:0, info:()=>`Pagine: ${S.pages.length}/6 (ne servono 3)`}
];
