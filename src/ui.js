// ===================== INTERFACCIA HTML =====================
const $=id=>document.getElementById(id);
let menuOpen=false, shopOpen=false, menuTab='missione';
function showTitle(){ $('title').classList.remove('hidden'); mode='title'; AU.setMusic('title'); const s=loadSave(); $('btnCont').disabled=!s; $('btnCont').textContent=s?`Continua  ·  ${s.fireflies||0}/${TOTAL_FIREFLIES} lucciole`:'Continua'; }
function startGame(cont){
 AU.init(); S=cont&&loadSave()||newState(); if(!S.stats.frogseq) S.stats.frogseq=[];
 $('title').classList.add('hidden');
 P=mkPlayer(S.px,S.py); pip=null; room=null; parts=[]; floaters=[]; banner=null; bossRef=null;
 enterRoom(S.world+':'+S.rx+','+S.ry); mode='play';
 if(pendingKonami){ pendingKonami=false; S.konami=true; award('konami'); }
 if(!S.flags.intro&&!cont){ say(['C\'era una volta, in una valle avvolta dalla nebbia, un villaggio chiamato Brumafonda.',
  'Al centro del villaggio ardeva la Grande Lanterna, nutrita da tre Fiamme antiche: del Bosco, del Mare e del Vento.',
  'Finché, una notte, un\'ombra grigia con ali enormi scese dal cielo... e la Lanterna si spense.',
  'Ilio, giovane apprendista lampionaio, si sveglia di soprassalto.',
  'Pip: Ilio! Ilio! Svegliati! La nonna ti cerca, è qui fuori! Quella con il vestito viola!',
  'Pip: Guarda in basso a sinistra: lì c\'è sempre il nostro obiettivo. Una freccia dorata ti indica la strada, e una stellina il punto esatto.',
  'Pip: Muoviti con le frecce (o il joystick) e parla con A. Se ti perdi, premi ✦ o il tasto P: ti dico io cosa fare!']); }
 else if(cont) banner={text:room.def.name,t:2.4};
}
$('btnNew').addEventListener('click',()=>{ if(loadSave()){ $('confirm').classList.remove('hidden'); return; } startGame(false); });
$('btnCont').addEventListener('click',()=>startGame(true));
$('cYes').addEventListener('click',()=>{ $('confirm').classList.add('hidden'); try{localStorage.removeItem(SAVE_KEY);}catch(e){} startGame(false); });
$('cNo').addEventListener('click',()=>$('confirm').classList.add('hidden'));
let logoTaps=0; $('logo').addEventListener('click',()=>{ logoTaps++; AU.init(); AU.tone(600+logoTaps*80,0.1,'triangle',0.06); if(logoTaps===7) onKonami(); });

function openMenu(){ menuOpen=true; mode='menu'; $('menu').classList.remove('hidden'); renderMenu(); AU.sfx('menu'); }
function closeMenu(){ menuOpen=false; $('menu').classList.add('hidden'); mode='play'; AU.sfx('menu'); }
$('menuClose').addEventListener('click',closeMenu);
document.querySelectorAll('#tabs button').forEach(b=>b.addEventListener('click',()=>{ menuTab=b.dataset.t; renderMenu(); AU.sfx('menu'); }));
function iconCanvas(name,size=40){ const c=document.createElement('canvas'); c.width=size*2; c.height=size*2; const g=c.getContext('2d'); g.setTransform(2,0,0,2,0,0); if(name==='firefly') drawFirefly(g,size/2,size/2,1.2,1); else drawIcon(g,name,size/2,size/2,size/26); return c.toDataURL(); }
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function renderMenu(){
 document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===menuTab));
 const box=$('menuBody'); let h='';
 if(menuTab==='missione'){
  h+=`<h4>Obiettivo attuale</h4><div class="page" style="background:rgba(255,224,138,.15);color:#fff;font-family:Fredoka,sans-serif">★ ${esc(curObjective().t)}</div><h4>Diario delle missioni</h4>`;
  let cur=false; for(const q of QUESTS){ const d=q.done(); const now=!d&&!cur; if(now) cur=true; h+=`<div class="pill ${d||now?'':'off'}" style="margin-bottom:6px;font-size:14px">${d?'✓':now?'▶':'○'} ${esc(now||d?q.t:'???')}</div>`; }
  h+=`<p class="hint">Premi ✦ (o P) durante il gioco per un consiglio di Pip.</p>`;
 }
 if(menuTab==='zaino'){
  h+='<div class="grid">'; for(const k of ['pertica','lanterna','rampino','campana']){ const has=S.items[k]; h+=`<div class="card ${has?'':'locked'} ${S.sel===k?'sel':''}" data-it="${k}"><img src="${has?iconCanvas(k):''}" alt=""><b>${has?esc(ITEMS[k].name):'???'}</b><span>${has?esc(ITEMS[k].desc):'Non ancora trovato.'}</span></div>`; } h+='</div>';
  const fn=['Fiamma del Bosco','Fiamma del Mare','Fiamma del Vento']; h+='<h4>Fiamme della Grande Lanterna</h4><div class="row">'; fn.forEach((n,i)=>{ h+=`<div class="pill ${S.flags['flame'+i]?'':'off'}">${S.flags['flame'+i]?'<img src="'+iconCanvas('flame'+i,28)+'">':''}${n}</div>`; }); h+='</div>';
  h+=`<p class="hint">Tocca un oggetto per assegnarlo al tasto B.</p>`;
 }
 if(menuTab==='mappa'){
  const w=room.w, keys=Object.keys(ROOMS).filter(k=>k.startsWith(w+':')); let mx=0,my=0; keys.forEach(k=>{ const [x,y]=k.split(':')[1].split(',').map(Number); mx=Math.max(mx,x); my=Math.max(my,y); });
  const names={ow:'Valle di Brumafonda',d1:'Tana del Fungo',d2:'Faro Sommerso',d3:'Campanile Spezzato',fn:'Nido della Falena'};
  h+=`<h4>${names[w]}</h4><div class="map" style="grid-template-columns:repeat(${mx+1},1fr)">`;
  for(let y=0;y<=my;y++) for(let x=0;x<=mx;x++){ const k=w+':'+x+','+y, r=ROOMS[k]; if(!r){ h+='<div class="mc none"></div>'; continue; }
   const vis=S.visited[k], here=room.key===k; let ff=0; if(S.flags.bussola){ r.map.forEach((row,yy)=>[...row].forEach((c,xx)=>{ if(c==='f'&&!S.got[k+'|f|'+xx+','+yy]) ff++; })); }
   h+=`<div class="mc ${vis?'vis':''} ${here?'here':''} ${r.boss?'boss':''}"><span>${vis?esc(r.name):'?'}</span>${ff?`<i>✦${ff}</i>`:''}${here?'<em>●</em>':''}</div>`; }
  h+='</div>'; h+=`<p class="hint">${S.flags.bussola?'✦ = lucciole ancora nascoste in quella zona.':'La Bussola delle Lucciole di Ciottolo mostrerebbe dove si nascondono le lucciole.'}</p>`;
 }
 if(menuTab==='collezione'){
  const m=Math.floor(S.stats.time/60);
  h+=`<div class="stats"><div><img src="${iconCanvas('firefly')}"><b>${S.fireflies}/${TOTAL_FIREFLIES}</b><span>Lucciole</span></div><div><img src="${iconCanvas('piece')}"><b>${S.pieces%4}/4</b><span>Frammenti (tot. ${S.pieces})</span></div><div><img src="${iconCanvas('shell')}"><b>${S.shells}</b><span>Conchiglie</span></div><div><b class="big">${S.pages.length}/6</b><span>Pagine</span></div><div><b class="big">${m} min</b><span>Tempo</span></div><div><b class="big">${S.stats.kills}</b><span>Nemici</span></div></div>`;
  h+=`<h4>Lampioni di Brumafonda</h4><div class="row">${[6,12,18,24].map(n=>`<div class="pill ${S.fireflies>=n?'':'off'}">${S.fireflies>=n?'💡':'○'} ${n} lucciole</div>`).join('')}</div>`;
 }
 if(menuTab==='diario'){
  if(!S.pages.length) h+='<p class="hint">Nessuna pagina trovata. Il diario di Nonna Orsola è sparso per la valle.</p>';
  [0,1,2,3,4,5].forEach(i=>{ h+= S.pages.includes(i)?`<div class="page"><b>Pagina ${i+1}</b><p>${esc(PAGES[i])}</p></div>`:`<div class="page off"><b>Pagina ${i+1}</b><p>…</p></div>`; });
 }
 if(menuTab==='trofei'){ h+='<div class="trophies">'; for(const [id,n,d] of TROPHIES){ const has=S.trophies[id]; h+=`<div class="tr ${has?'':'off'}"><b>${has?'🏆':'🔒'} ${esc(n)}</b><span>${esc(has?d:(id==='konami'||id==='gatto'?'???':d))}</span></div>`; } h+='</div>'; }
 if(menuTab==='opzioni'){
  h+=`<h4>Comandi</h4><table class="keys"><tr><td>Muoversi</td><td>Frecce / WASD · joystick</td></tr><tr><td>A · Pertica, parla, apri</td><td>Spazio / J / Z</td></tr><tr><td>Fendente rotante</td><td>Tieni premuto A e rilascia</td></tr><tr><td>B · Oggetto</td><td>K / X</td></tr><tr><td>Cambia oggetto</td><td>Q / L / C · ⟳</td></tr><tr><td>Chiedi a Pip</td><td>P / H · ✦</td></tr><tr><td>Menu</td><td>Esc / M · ☰</td></tr></table>`;
  h+=`<div class="row"><button class="btn" id="optMute">${AU.muted?'Attiva audio':'Disattiva audio'}</button><button class="btn" id="optGuide">${S.flags.noGuide?'Mostra guida':'Nascondi guida'}</button><button class="btn" id="optTitle">Torna al titolo</button></div><p class="hint">Il gioco si salva da solo a ogni cambio di stanza.</p>`;
 }
 box.innerHTML=h;
 box.querySelectorAll('[data-it]').forEach(el=>el.addEventListener('click',()=>{ const k=el.dataset.it; if(k!=='pertica'&&S.items[k]){ S.sel=k; renderMenu(); AU.sfx('menu'); } }));
 const om=$('optMute'); om&&om.addEventListener('click',()=>{ AU.setMute(!AU.muted); $('bMute').textContent=AU.muted?'♪̸':'♪'; renderMenu(); });
 const og=$('optGuide'); og&&og.addEventListener('click',()=>{ S.flags.noGuide=!S.flags.noGuide; save(); renderMenu(); });
 const ot=$('optTitle'); ot&&ot.addEventListener('click',()=>{ save(); closeMenu(); showTitle(); });
}

function openShop(){ shopOpen=true; mode='shop'; $('shop').classList.remove('hidden'); renderShop(); }
function closeShop(){ shopOpen=false; $('shop').classList.add('hidden'); if(mode==='shop') mode='play'; }
$('shopClose').addEventListener('click',()=>{ closeShop(); });
function renderShop(){
 let h=`<p class="wallet"><img src="${iconCanvas('shell',28)}"> ${S.shells} conchiglie</p>`;
 for(const it of SHOP){ const sold=it.once&&S.bought[it.id]; const can=!sold&&S.shells>=it.price&&(!it.ok||it.ok());
  h+=`<div class="shopit ${sold?'sold':''}"><div><b>${esc(it.name)}</b><span>${esc(sold?'Esaurito.':it.desc)}</span></div><button class="btn" data-buy="${it.id}" ${can?'':'disabled'}>${sold?'—':it.price+' ◈'}</button></div>`; }
 $('shopBody').innerHTML=h;
 $('shopBody').querySelectorAll('[data-buy]').forEach(b=>b.addEventListener('click',()=>{ const it=SHOP.find(x=>x.id===b.dataset.buy); if(S.shells<it.price) return; S.shells-=it.price; if(it.once) S.bought[it.id]=1; AU.sfx('coin'); it.buy(); save(); if(shopOpen) renderShop(); }));
}

// ===================== LOOP =====================
let last=performance.now();
function frame(now){
 const dt=Math.min(0.033,(now-last)/1000); last=now;
 pollInput();
 try{ update(dt); render(); }catch(err){ console.error(err); }
 IN.tapAdv=0;
 requestAnimationFrame(frame);
}
window.__dbg={ROOMS,goto(k,x,y){ const [w,xy]=k.split(':'); const [rx,ry]=xy.split(',').map(Number); S.world=w; S.rx=rx; S.ry=ry; P.x=x; P.y=y; dlg=null; mode='play'; room=null; enterRoom(k); dlg=null; mode='play'; },get dlg(){return dlg},get parts(){return parts},get S(){return S},get P(){return P},get room(){return room},get ents(){return ents},startGame,enterRoom,warpTo,get mode(){return mode}};
resize();
(document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(()=>{});
showTitle();
requestAnimationFrame(frame);
