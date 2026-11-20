// ===================== CORE =====================
const TS=32,CW=16,CH=11,VW=CW*TS,VH=CH*TS,HUD=48,GW=VW,GH=VH+HUD;
const cv=document.getElementById('cv'), ctx=cv.getContext('2d');
let K=1, CSS_S=1; // device pixels per logical pixel
const rand=(a,b)=>a+Math.random()*(b-a), clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
const dist=(a,b,c,d)=>Math.hypot(c-a,d-b), pick=a=>a[(Math.random()*a.length)|0];
const hash=(x,y,s=0)=>{let h=(x*374761393+y*668265263+s*982451653)|0;h=(h^(h>>>13))*1274126177|0;return ((h^(h>>>16))>>>0)/4294967295};
const easeOut=t=>1-(1-t)*(1-t), easeInOut=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const isTouch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;

function resize(){
  const portrait = innerHeight>innerWidth;
  let aw=innerWidth, ah=innerHeight;
  if(isTouch){ if(portrait) ah=innerHeight-290; else aw=innerWidth-300; } else ah-=56;
  aw-=8; ah-=8;
  const s=Math.max(0.4,Math.min(aw/GW, ah/GH));
  const dpr=Math.min(window.devicePixelRatio||1,2);
  cv.style.width=(GW*s)+'px'; cv.style.height=(GH*s)+'px';
  K=s*dpr; CSS_S=s;
  cv.width=Math.round(GW*K); cv.height=Math.round(GH*K);
  document.body.classList.toggle('portrait',portrait);
  if(snapCv){snapCv.width=cv.width;snapCv.height=cv.height;}
}
let snapCv=document.createElement('canvas');
addEventListener('resize',resize);

// ===================== AUDIO =====================
const MUS={
 village:{bpm:92,root:60,scale:[0,2,4,7,9],prog:[0,5,-3,7],lead:'triangle',seed:3},
 field:{bpm:108,root:62,scale:[0,2,4,7,9],prog:[0,-5,5,7],lead:'triangle',seed:11},
 wind:{bpm:84,root:57,scale:[0,2,3,7,10],prog:[0,-2,3,5],lead:'sine',seed:7},
 dark:{bpm:66,root:55,scale:[0,1,5,7,8],prog:[0,1,-4,-5],lead:'sine',seed:5},
 sea:{bpm:88,root:59,scale:[0,2,4,7,11],prog:[0,4,5,-5],lead:'triangle',seed:21},
 dungeon:{bpm:78,root:50,scale:[0,3,5,7,10],prog:[0,-4,-2,-5],lead:'triangle',seed:13},
 water:{bpm:74,root:52,scale:[0,2,3,7,9],prog:[0,3,-4,-2],lead:'sine',seed:17},
 tower:{bpm:96,root:53,scale:[0,2,5,7,10],prog:[0,-2,5,3],lead:'triangle',seed:29},
 boss:{bpm:142,root:45,scale:[0,1,3,7,8],prog:[0,1,0,-2],lead:'square',seed:31,drums:1},
 final:{bpm:152,root:43,scale:[0,1,4,6,7],prog:[0,1,-2,-1],lead:'sawtooth',seed:37,drums:1},
 title:{bpm:72,root:57,scale:[0,2,4,7,9],prog:[0,-4,-7,-2],lead:'sine',seed:2}
};
const AU={ctx:null,m:null,mus:null,muted:false,cur:null,step:0,next:0,pat:{},
 init(){
  if(this.ctx){ if(this.ctx.state==='suspended') this.ctx.resume(); return; }
  try{
   const C=window.AudioContext||window.webkitAudioContext; this.ctx=new C();
   this.m=this.ctx.createGain(); this.m.gain.value=this.muted?0:0.6; this.m.connect(this.ctx.destination);
   this.mus=this.ctx.createGain(); this.mus.gain.value=0.32; this.mus.connect(this.m);
   const n=this.ctx.sampleRate; this.nb=this.ctx.createBuffer(1,n,n); const d=this.nb.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1;
   setInterval(()=>this.sched(),40);
   if(this.cur){ this.next=this.ctx.currentTime+0.1; }
  }catch(e){ this.ctx=null; }
 },
 setMute(v){ this.muted=v; if(this.m) this.m.gain.value=v?0:0.6; },
 tone(f,d,type='square',v=0.12,slide=0,delay=0,dest){
  if(!this.ctx) return; const t=this.ctx.currentTime+delay;
  const o=this.ctx.createOscillator(), g=this.ctx.createGain(); o.type=type;
  o.frequency.setValueAtTime(f,t); if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(20,f*slide),t+d);
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(v,t+0.008); g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  o.connect(g); g.connect(dest||this.m); o.start(t); o.stop(t+d+0.05);
 },
 noise(d,v=0.2,fq=2000,delay=0,type='bandpass',slide=0,dest){
  if(!this.ctx) return; const t=this.ctx.currentTime+delay;
  const s=this.ctx.createBufferSource(); s.buffer=this.nb; const f=this.ctx.createBiquadFilter(); f.type=type; f.frequency.setValueAtTime(fq,t);
  if(slide) f.frequency.exponentialRampToValueAtTime(fq*slide,t+d);
  const g=this.ctx.createGain(); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  s.connect(f); f.connect(g); g.connect(dest||this.m); s.start(t,Math.random()*0.5); s.stop(t+d+0.05);
 },
 sfx(n){
  if(!this.ctx) return; const T=this;
  switch(n){
   case 'swing': T.noise(0.12,0.18,1800,0,'bandpass',3); break;
   case 'spin': T.noise(0.3,0.22,900,0,'bandpass',5); T.tone(300,0.3,'triangle',0.06,2.5); break;
   case 'charge': T.tone(600,0.1,'sine',0.06,1.5); break;
   case 'hit': T.tone(180,0.12,'square',0.12,0.4); T.noise(0.08,0.2,800); break;
   case 'kill': T.tone(400,0.25,'square',0.08,0.2); T.noise(0.25,0.18,600,0,'lowpass',0.3); break;
   case 'clang': T.tone(1400,0.15,'square',0.07,0.9); T.tone(2100,0.2,'triangle',0.06); break;
   case 'hurt': T.tone(330,0.25,'sawtooth',0.12,0.4); break;
   case 'cut': T.noise(0.15,0.2,3000,0,'highpass'); break;
   case 'coin': T.tone(1320,0.07,'square',0.06); T.tone(1760,0.12,'square',0.06,0,0.06); break;
   case 'heart': T.tone(880,0.08,'triangle',0.1); T.tone(1175,0.12,'triangle',0.1,0,0.07); break;
   case 'firefly': [0,4,7,12,16].forEach((s,i)=>T.tone(880*2**(s/12),0.3,'sine',0.07,0,i*0.07)); break;
   case 'secret': [0,3,7,10,12,15,19,24].forEach((s,i)=>T.tone(523*2**(s/12),0.25,'triangle',0.08,0,i*0.08)); break;
   case 'item': [0,4,7,12,7,12,16,19,24].forEach((s,i)=>T.tone(392*2**(s/12),0.35,'triangle',0.09,0,i*0.1)); break;
   case 'fire': T.noise(0.35,0.25,500,0,'lowpass',4); break;
   case 'burn': T.noise(0.5,0.18,1200,0,'bandpass',0.3); break;
   case 'torch': T.noise(0.3,0.2,700,0,'lowpass',3); T.tone(440,0.3,'sine',0.06,2); break;
   case 'hook': T.tone(900,0.15,'square',0.05,0.5); T.noise(0.12,0.08,4000,0,'highpass'); break;
   case 'clink': T.tone(1800,0.08,'square',0.06); break;
   case 'bell': [1,2.76,5.4,8.9].forEach((m,i)=>T.tone(523*m,1.6-i*0.3,'sine',0.12/(i+1))); break;
   case 'shatter': for(let i=0;i<6;i++) T.tone(rand(2000,4500),0.2,'triangle',0.04,0.5,i*0.025); T.noise(0.3,0.2,3500,0,'highpass'); break;
   case 'door': T.tone(120,0.3,'square',0.08,0.6); T.noise(0.3,0.15,300,0,'lowpass'); break;
   case 'chest': [0,2,4,5,7,9,11,12].forEach((s,i)=>T.tone(523*2**(s/12),0.12,'square',0.05,0,i*0.05)); break;
   case 'talk': T.tone(rand(500,700),0.04,'square',0.025); break;
   case 'text': T.tone(880,0.06,'triangle',0.06); break;
   case 'fall': T.tone(600,0.6,'triangle',0.1,0.15); break;
   case 'push': T.noise(0.25,0.12,250,0,'lowpass'); break;
   case 'plate': T.tone(220,0.1,'square',0.08); T.tone(330,0.15,'square',0.08,0,0.1); break;
   case 'open': [0,7,12].forEach((s,i)=>T.tone(330*2**(s/12),0.3,'triangle',0.08,0,i*0.12)); T.noise(0.5,0.1,200,0,'lowpass'); break;
   case 'frog': break;
   case 'boss': T.tone(55,1.2,'sawtooth',0.15,0.5); T.noise(1,0.2,200,0,'lowpass'); break;
   case 'bubble': T.tone(rand(300,500),0.12,'sine',0.08,2.5); break;
   case 'meow': T.tone(700,0.35,'triangle',0.08,0.6); T.tone(900,0.2,'sine',0.04,0.7,0.05); break;
   case 'warp': T.tone(200,0.8,'sine',0.1,4); T.noise(0.8,0.1,800,0,'bandpass',4); break;
   case 'menu': T.tone(660,0.06,'triangle',0.06); break;
  }
 },
 frog(i){ const notes=[0,4,7,12]; this.tone(196*2**(notes[i]/12),0.35,'square',0.08,0.98); this.tone(98*2**(notes[i]/12),0.3,'sine',0.1); },
 setMusic(n){ if(this.cur===n) return; this.cur=n; this.step=0; if(this.ctx) this.next=this.ctx.currentTime+0.15; },
 patt(name){
  if(this.pat[name]) return this.pat[name];
  const th=MUS[name]; let s=th.seed*9301+49297; const r=()=>{s=(s*9301+49297)%233280;return s/233280;};
  const mel=[]; let deg=2;
  for(let i=0;i<64;i++){
    if(i%16>=8 && i<32) { mel.push(mel[i-8]); continue; } // ripetizione del motivo
    if(r()<0.38 && i%2===1){ mel.push(null); continue; }
    deg+= Math.round((r()-0.5)*3); deg=clamp(deg,0,9);
    mel.push(Math.floor(deg/5)*12+th.scale[deg%5]);
  }
  return this.pat[name]=mel;
 },
 sched(){
  if(!this.ctx||!this.cur||this.muted) { if(this.ctx) this.next=Math.max(this.next,this.ctx.currentTime); return; }
  const th=MUS[this.cur], mel=this.patt(this.cur), spb=60/th.bpm/2;
  if(this.next<this.ctx.currentTime) this.next=this.ctx.currentTime+0.05;
  while(this.next<this.ctx.currentTime+0.25){
   const st=this.step, t=this.next-this.ctx.currentTime, bar=Math.floor(st/8)%4, base=th.root+th.prog[bar];
   const n=mel[st%64];
   if(n!==null) this.tone(440*2**((th.root+12+n-69)/12), spb*1.8, th.lead, th.drums?0.045:0.07, 0, t, this.mus);
   if(st%8===0){ this.tone(440*2**((base-12-69)/12), spb*7.5,'triangle',0.11,0,t,this.mus);
     [0,4,7].forEach(iv=>this.tone(440*2**((base+iv-69)/12), spb*7,'sine',0.025,0,t,this.mus)); }
   if(st%8===4) this.tone(440*2**((base-12+7-69)/12), spb*3,'triangle',0.08,0,t,this.mus);
   if(th.drums){ if(st%4===0) this.tone(110,0.15,'sine',0.25,0.3,t,this.mus); if(st%4===2) this.noise(0.08,0.06,6000,t,'highpass',0,this.mus); if(st%8===4) this.noise(0.15,0.12,1500,t,'bandpass',0,this.mus); }
   this.step++; this.next+=spb;
  }
 }
};

// ===================== INPUT =====================
const KB={}, LATCH={};
const IN={x:0,y:0,a:0,b:0,c:0,m:0,p:0, pa:0,pb:0,pc:0,pm:0,pp:0, aP:0,aR:0,bP:0,cP:0,mP:0,pP:0, joyx:0,joyy:0, ta:0,tb:0,tc:0,tm:0,tp:0};
const KMAP={ArrowUp:'u',KeyW:'u',ArrowDown:'d',KeyS:'d',ArrowLeft:'l',KeyA:'l',ArrowRight:'r',KeyD:'r',
 Space:'a',KeyJ:'a',KeyZ:'a',Enter:'a', KeyK:'b',KeyX:'b', KeyQ:'c',KeyL:'c',KeyC:'c', Escape:'m',KeyM:'m',Tab:'m', KeyP:'p',KeyH:'p'};
const konamiSeq='uuddlrlrba'; let konamiBuf='';
function konamiPush(ch){ konamiBuf=(konamiBuf+ch).slice(-10); if(konamiBuf===konamiSeq) onKonami(); }
addEventListener('keydown',e=>{
 const k=KMAP[e.code]; if(!k) return; e.preventDefault(); AU.init();
 if(!KB[k]){ if('udlr'.includes(k)) konamiPush(k); if(k==='a'||k==='b') konamiPush(k==='a'?'a':'b'); }
 if(!KB[k]) LATCH[k]=1; KB[k]=1;
});
addEventListener('keyup',e=>{ const k=KMAP[e.code]; if(k){KB[k]=0;e.preventDefault();} });
function pollInput(){
 let x=(KB.r?1:0)-(KB.l?1:0), y=(KB.d?1:0)-(KB.u?1:0);
 if(IN.joyx||IN.joyy){ x=IN.joyx; y=IN.joyy; }
 const l=Math.hypot(x,y); if(l>1){x/=l;y/=l;}
 IN.x=x; IN.y=y;
 for(const b of ['a','b','c','m','p']){ const v=(KB[b]||IN['t'+b])?1:0, l=LATCH[b]; LATCH[b]=0; IN[b+'P']=(v&&!IN['p'+b])||l?1:0; if(b==='a') IN.aR=(!v&&(IN.pa||l))?1:0; IN['p'+b]=v; IN[b]=v; }
}
// joystick
(function(){
 const joy=document.getElementById('joy'), knob=document.getElementById('knob'); let id=null, cx=0, cy=0, lastDir='';
 const upd=(px,py)=>{ let dx=px-cx, dy=py-cy; const l=Math.hypot(dx,dy), R=48; if(l>R){dx*=R/l;dy*=R/l;}
  knob.style.transform=`translate(${dx}px,${dy}px)`; let jx=dx/R, jy=dy/R; if(Math.hypot(jx,jy)<0.22){jx=0;jy=0;}
  IN.joyx=jx; IN.joyy=jy;
  let d=''; if(Math.hypot(jx,jy)>0.6){ d=Math.abs(jx)>Math.abs(jy)?(jx>0?'r':'l'):(jy>0?'d':'u'); }
  if(d&&d!==lastDir) konamiPush(d); lastDir=d; };
 joy.addEventListener('pointerdown',e=>{ AU.init(); id=e.pointerId; joy.setPointerCapture(id); const r=joy.getBoundingClientRect(); cx=r.left+r.width/2; cy=r.top+r.height/2; upd(e.clientX,e.clientY); e.preventDefault(); });
 joy.addEventListener('pointermove',e=>{ if(e.pointerId===id) upd(e.clientX,e.clientY); });
 const end=e=>{ if(e.pointerId!==id) return; id=null; IN.joyx=IN.joyy=0; knob.style.transform=''; lastDir=''; };
 joy.addEventListener('pointerup',end); joy.addEventListener('pointercancel',end);
 const bind=(el,k)=>{ el.addEventListener('pointerdown',e=>{ AU.init(); IN['t'+k]=1; LATCH[k]=1; if(k==='a'||k==='b') konamiPush(k); el.classList.add('on'); e.preventDefault(); });
  const off=()=>{IN['t'+k]=0; el.classList.remove('on');}; el.addEventListener('pointerup',off); el.addEventListener('pointerleave',off); el.addEventListener('pointercancel',off); };
 bind(document.getElementById('bA'),'a'); bind(document.getElementById('bB'),'b'); bind(document.getElementById('bC'),'c');
 document.getElementById('bMenu').addEventListener('click',()=>{AU.init(); IN.tmClick=1;});
 document.getElementById('bPip').addEventListener('click',()=>{AU.init(); IN.tpClick=1;});
 document.getElementById('bMute').addEventListener('click',e=>{AU.init(); AU.setMute(!AU.muted); e.currentTarget.textContent=AU.muted?'♪̸':'♪'; e.currentTarget.classList.toggle('off',AU.muted);});
 cv.addEventListener('pointerdown',()=>{ AU.init(); if(mode==='dialog'||mode==='ending') IN.tapAdv=1; });
})();

// ===================== SALVATAGGIO =====================
const SAVE_KEY='brumafonda_save_v1';
function newState(){ return {world:'ow',rx:1,ry:2,px:7.5*TS,py:7.6*TS,hp:6,maxhp:6,shells:0,
 items:{pertica:false,lanterna:false,rampino:false,campana:false},sel:null,keys:{},flames:0,
 got:{},flags:{},fireflies:0,pieces:0,pages:[],trophies:{},visited:{},bought:{},
 stats:{bushes:0,torches:0,falls:0,spins:0,pip:0,cat:0,graves:{},deaths:0,time:0,ciottolo:0,frogseq:[],kills:0},konami:false}; }
let S=null;
function save(){ try{ localStorage.setItem(SAVE_KEY,JSON.stringify(S)); }catch(e){} }
function loadSave(){ try{ const s=localStorage.getItem(SAVE_KEY); return s?JSON.parse(s):null; }catch(e){ return null; } }
