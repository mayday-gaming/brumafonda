// ===================== PERSONAGGI =====================
const NPC={
 orsola:{name:'Nonna Orsola',look:{skin:'#f0c9a0',hair:'#e4e0ea',hairStyle:'bun',body:'#7a5aa6',scarf:'#b48ad6',glasses:1,pants:'#5a4a6a',boots:'#4a3040'},
  talk(){ const f=S.flags;
   if(!f.intro){ return ['Nonna Orsola: Ilio! Finalmente sei sveglio.',
    'Nonna Orsola: Stanotte la Grande Lanterna si è spenta. Una falena enorme, grigia come la cenere, ha rubato le tre Fiamme che la tenevano accesa.',
    'Nonna Orsola: Senza Lanterna, la Notte Lunga scenderà su Brumafonda. E non se ne andrà più.',
    'Nonna Orsola: Prendi la mia vecchia Pertica da lampionaia. Serve ad accendere i lampioni... e a dare qualche bastonata, all\'occorrenza.',
    {fn:()=>giveItemQuiet('pertica')},
    'Nonna Orsola: E porta con te Pip. È la lucciola più chiacchierona della valle, ma conosce ogni sentiero.',
    'Pip: Ehi! «Chiacchierona» è una parola grossa. Io preferisco «ben informata».',
    'Nonna Orsola: Anche le altre lucciole sono scappate quando la Lanterna si è spenta. Se le ritrovi, i lampioni del villaggio torneranno ad accendersi.',
    'Nonna Orsola: La prima Fiamma è nel Bosco Muschiato, dentro la Tana del Fungo. A nord-ovest, passando dal crocevia.',
    {fn:()=>{S.flags.intro=1; award('primo'); save();}}]; }
   if(S.flames>=3) return ['Nonna Orsola: Le tre Fiamme... ce l\'hai fatta, Ilio.','Nonna Orsola: Quella falena. Temo di sapere chi sia. Se lo incontri nel Nido... prova a parlargli, prima di colpirlo.','Nonna Orsola: Il Nido è a nord-est, oltre il Campanile.'];
   if(S.items.campana) return ['Nonna Orsola: Il Campanile Spezzato! Ai miei tempi suonava ogni sera al tramonto.','Nonna Orsola: Lassù c\'è l\'ultima Fiamma, quella del Vento.'];
   if(S.items.rampino) return ['Nonna Orsola: Un rampino? Allora puoi attraversare l\'Abisso del Vento, a nord del crocevia.','Nonna Orsola: Oltre l\'abisso c\'è il Campanile. Le sue torce si accendono solo con la luce vera.'];
   if(S.items.lanterna) return ['Nonna Orsola: La mia lanterna! L\'ho persa trent\'anni fa in quella tana. Fanne buon uso.','Nonna Orsola: Brucia i rovi a est del villaggio. Oltre la spiaggia c\'è il Faro Sommerso.'];
   return ['Nonna Orsola: La Tana del Fungo è nel Bosco Muschiato, a nord-ovest.','Nonna Orsola: E ricordati: se ti senti perso, chiedi a Pip (tasto P o ✦).']; }},
 lalla:{name:'Lalla la Fornaia',look:{skin:'#e8b48a',hair:'#6b3a1e',hairStyle:'long',body:'#d9584a',apron:'#fff6e6',hat:'band',hatc:'#fff6e6',pants:'#7a4a3a'},
  talk(){ const l=['Lalla: Senza la Lanterna il mio forno non lievita. Il pane viene piatto come una lapide!'];
   if(S.hp<S.maxhp){ l.push('Lalla: Ma guarda come sei ridotto! Tieni, una pagnotta calda.'); l.push({fn:()=>{S.hp=S.maxhp; AU.sfx('heart'); floatText(P.x,P.y-40,'Cuori ricaricati!','#ff9aa8');}}); }
   else l.push(pick(['Lalla: Il gatto Bricco ruba sempre le briciole. Ma secondo me sa qualcosa che noi non sappiamo.','Lalla: Dicono che le rane del prato cantino solo per chi conosce la loro canzone.','Lalla: Se torni ferito, passa da me. Il pane cura tutto, tranne la noia.']));
   return l; }},
 tito:{name:'Tito',look:{skin:'#f2c79b',hair:'#e0a040',hairStyle:'spiky',body:'#e07a2e',hat:'cap',hatc:'#3a6ad0',size:0.82,pants:'#3a4a7a'},
  talk(){ if(!S.flags.titoPage){ return ['Tito: Ilio! Ho trovato questo foglio vicino alla casa della nonna. Sembra il suo diario!', {fn:()=>{S.flags.titoPage=1; gainPage(0);}}]; }
   S.flags.tito=(S.flags.tito||0)+1;
   return [pick(['Tito: Lo sai che le lucciole perse si nascondono nei posti più strani? Una volta ne ho vista una dentro una tana di fungo!','Tito: Facciamo a nascondino? Conto fino a cento... uno... due... ehi, non vale correre via!','Tito: Da grande voglio fare il lampionaio. O il gatto. Ancora non ho deciso.','Tito: Ho sentito che sulla tomba del cimitero c\'è scritto un numero. Quattrocentoquattro. Che vorrà dire?'])]; }},
 ugo:{name:'Ugo il Viandante',look:{skin:'#d8a47a',hair:'#3a2a20',body:'#7a6a4a',belt:'#4a3020',beard:'#4a3a2a',hat:'wide',hatc:'#6a4a30',pack:1,cape:'#5a4a3a'},
  talk(){ if(S.items.rampino) return ['Ugo: Un rampino! Ora sì che si vola. Più o meno.','Ugo: Nell\'abisso, punta il palo dall\'altra parte e lascia fare alla corda.'];
   return ['Ugo: Sono Ugo, viandante di professione e di vocazione.','Ugo: A nord c\'è l\'Abisso del Vento. Nessuno lo attraversa senza un rampino.','Ugo: Si dice che il guardiano del Faro Sommerso ne avesse uno. Peccato che il faro sia sott\'acqua da cent\'anni.']; }},
 fausto:{name:'Mugnaio Fausto',look:{skin:'#efc9a8',hair:'#c9c0b0',body:'#d8c8a0',apron:'#f4ece0',hat:'wide',hatc:'#e0c070',beard:'#f0ece4',pants:'#6a5a4a'},
  talk(){ if(S.items.lanterna&&!S.flags.fausto){ return ['Fausto: Hai la lanterna di Orsola! Allora sei tu che brucerai quei rovi.','Fausto: Tieni, trenta conchiglie per il viaggio. Non spenderle tutte da Ciottolo, è un usuraio con il guscio.',{fn:()=>{S.flags.fausto=1; S.shells+=30; AU.sfx('coin'); floatText(P.x,P.y-40,'+30 conchiglie','#ffb3c7');}}]; }
   return [pick(['Fausto: Il mulino gira anche senza vento. Non chiedermi come: segreto di famiglia.','Fausto: I rovi a est sono cresciuti in una sola notte, quando la Lanterna si è spenta. Solo il fuoco li ferma.','Fausto: Sai qual è il colmo per un mugnaio? Avere un cuore di farina... no, aspetta, non era così.'])]; }},
 barnaba:{name:'Barnaba il Pescatore',look:{skin:'#d89a72',hair:'#5a4a3a',body:'#e8c03a',hat:'hood',hatc:'#e8c03a',beard:'#9a8a7a',pants:'#2a3a5a',boots:'#2a2a2a'},
  talk(){ return ['Barnaba: Il Faro Sommerso... una volta guidava le barche. Ora guida solo i pesci.','Barnaba: Laggiù vive un\'anguilla di rame, grossa come un tronco. Ha un lume sulla testa: chi lo afferra, la trascina fuori dall\'acqua.','Barnaba: Io? No no. Io pesco sardine. Le sardine non ti mangiano.']; }},
 marinella:{name:'Marinella',look:{skin:'#f2c79b',hair:'#3a2216',hairStyle:'braids',body:'#3f8fd0',collar:'#ffffff',size:0.86,pants:'#f2c79b',boots:'#c84a4a'},
  talk(){ return [pick(['Marinella: Raccolgo conchiglie! E tu cosa raccogli?',`Marinella: Lucciole? Ne hai già ${S.fireflies}! Io ne ho una sola, ma è un sasso che brilla.`,'Marinella: Se avvicini una conchiglia all\'orecchio senti il mare. Se avvicini Pip, senti Pip.','Marinella: Il faro laggiù è vuoto da tantissimo. Però di notte qualcosa dentro brilla. Io non ci entro!'])]; }},
 ciottolo:{name:'Ciottolo',look:{turtle:1},
  talk(){ S.stats.ciottolo++;
   if(S.stats.ciottolo===6) return ['Ciottolo: Ho trecentododici anni, sai? Il segreto è non correre mai.','Ciottolo: E non fare mai debiti con una tartaruga. Abbiamo molta, molta pazienza.',{fn:openShop}];
   return ['Ciottolo: Benvenuto nella bottega più lenta della valle. Ma anche la più onesta. Più o meno.',{fn:openShop}]; }},
 ortica:{name:'Strega Ortica',look:{skin:'#b8c9a0',hair:'#5a6a5a',hairStyle:'long',body:'#4a5a4a',hat:'witch',hatc:'#2e3a2e',nose:1,cape:'#2e3a2e',pants:'#2a2a2a'},
  talk(){ if(S.pages.length>=3&&!S.flags.ortica) return ['Ortica: Eh eh... vedo che hai raccolto le pagine della vecchia Orsola.','Ortica: Tieni questa lucciola. L\'ho trovata impigliata nella mia scopa. Mi faceva il solletico.',{fn:()=>{S.flags.ortica=1; gainFirefly(); save();}}];
   return ['Ortica: Eh eh... un lampionaio nella mia palude.','Ortica: La falena che cerchi un tempo aveva un nome. Lo trovi scritto nelle pagine perdute di Orsola.', S.pages.length<3?`Ortica: Portami la prova di averne lette almeno tre, e ti darò qualcosa che brilla. Ne hai lette ${S.pages.length}.`:'Ortica: Il buio non è un nemico, ragazzo. È solo la luce che si riposa.']; }}
};
function giveItemQuiet(n){ S.items[n]=true; AU.sfx('item'); P.hold=n; setTimeout(()=>{ if(P) P.hold=null; },1400); floatText(P.x,P.y-50,'Pertica del Lampionaio!','#ffe08a'); }

const CAT_LINES=['Il gatto ti guarda. Miao.','Il gatto sbadiglia con aria di superiorità.','Il gatto si gira dall\'altra parte.','Bricco: «Mrrr.»','Il gatto si lecca una zampa. Sembra pensieroso.','Il gatto finge di non conoscerti.','Bricco ti osserva. Forse sta per dire qualcosa.','Il gatto si stiracchia. Molto lentamente.','Bricco: «...miao?»'];
function talkCat(){ S.stats.cat++; AU.sfx('meow');
 if(S.stats.cat===10){ award('gatto'); return ['Il gatto si avvicina e ti sussurra all\'orecchio:','Bricco: «Su, su, giù, giù, sinistra, destra, sinistra, destra, B, A.»','Poi si lecca una zampa come se niente fosse. Sotto di lui c\'era una lucciola addormentata!',{fn:()=>{ if(!S.flags.cat){ S.flags.cat=1; gainFirefly(); save(); } }}]; }
 if(S.stats.cat>10) return [pick(['Bricco fa le fusa. Avete un segreto in comune, ora.','Bricco ti ignora. Ha già detto tutto quello che doveva.'])];
 return [CAT_LINES[(S.stats.cat-1)%CAT_LINES.length]]; }

function frogSing(e){
 AU.frog([0,1,2,3][['rossa','verde','gialla','blu'].indexOf(e.col)]); e.jump=1;
 addPart({x:e.x,y:e.y-26,vx:rand(-10,10),vy:-30,life:1,col:'#fff',size:9,type:'note'});
 const seq=S.stats.frogseq; seq.push(e.col); while(seq.length>4) seq.shift();
 if(seq.join()==='rossa,verde,gialla,blu'&&!S.flags.frogs){ S.flags.frogs=1; award('rane');
  setTimeout(()=>{ AU.sfx('secret'); say(['Le rane cantano in coro, tutte insieme! Il lago brilla per un istante.','Dal fondo dello stagno affiora una lucciola... e un foglio di carta asciutto, per miracolo.',{fn:()=>{ gainFirefly(); }},{fn:()=>gainPage(3)}]); },600); }
}

// ---------- suggerimenti di Pip ----------
function pipHint(){
 S.stats.pip++; if(S.stats.pip>=15) award('pip');
 const it=S.items; let h;
 if(!S.flags.intro) h='Parla con Nonna Orsola, è proprio qui nel villaggio. Avvicinati e premi A.';
 else if(!it.lanterna) h='La Tana del Fungo è nel Bosco Muschiato: dal villaggio vai a nord fino al crocevia, poi a ovest.';
 else if(!S.flags.flame0) h='Hai la lanterna! Con il tasto B brucia i rovi e accendi le torce. Nella tana c\'è una stanza buia con quattro torce...';
 else if(!it.rampino) h='I rovi a est del villaggio e vicino alla bottega ora possono bruciare! Il Faro Sommerso è in fondo alla spiaggia, a sud-est.';
 else if(!S.flags.flame1) h='Usa il rampino sui pali: ti tira dall\'altra parte dei baratri. E l\'anguilla... ha un lume sulla testa, no?';
 else if(!it.campana) h='L\'Abisso del Vento è a nord del crocevia. Oltre, il Campanile: accendi le sue torce per aprire la porta.';
 else if(!S.flags.flame2) h='La campana frantuma le pareti incrinate e scambia i cristalli arancioni e blu. Il gufo? Suona quando i suoi occhi diventano rossi!';
 else if(S.flames>=3&&!S.flags.done) h='Il Nido della Falena è a est del Campanile. Il sigillo si aprirà davanti alle tre Fiamme. Servirà tutto quello che hai imparato.';
 else h='Abbiamo salvato Brumafonda! Ma ci sono ancora segreti in giro...';
 const extra=[];
 if(S.fireflies<TOTAL_FIREFLIES) extra.push(`Lucciole ritrovate: ${S.fireflies}/${TOTAL_FIREFLIES}. Alcune si nascondono dietro rovi, rocce incrinate o... nei favori che fai alla gente.`);
 if(S.pages.length<6) extra.push(`Pagine del diario: ${S.pages.length}/6. La Strega Ortica, nella palude a sud-ovest, è curiosa di sapere cosa c'è scritto.`);
 if(S.pieces<4) extra.push('I Frammenti di Cuore sono spesso su isolotti o dietro pareti incrinate. Ciottolo ne vende uno.');
 if(!S.trophies.gatto) extra.push('Bricco, il gatto del villaggio, sembra sempre sul punto di dire qualcosa. Forse basta insistere.');
 if(!S.flags.frogs) extra.push('Al Prato delle Rane c\'è un cartello con una canzone. Le rane rispondono alla pertica...');
 const lines=['Pip: Il nostro obiettivo: '+curObjective().t+'.','Pip: '+h]; if(extra.length&&Math.random()<0.8) lines.push('Pip: '+pick(extra));
 return lines;
}
const PIP_IDLE=['Che bel posto per una lucciola!','Ilio, hai mai pensato di tagliare TUTTI i cespugli? Così, per scienza.','Ho freddo alle ali. Scherzo, sono una lucciola: sono sempre accesa.','Lo sapevi che le falene sono attratte dalla luce? Brrr.','Se ti perdi, premi ✦ e chiedi a me!','Le lapidi del cimitero dicono cose buffe. Lo so, le ho lette tutte. Due volte.'];

// ---------- negozio ----------
const SHOP=[
 {id:'pozione',name:'Pozione di Brace',desc:'Ricarica tutti i cuori.',price:15,ok:()=>S.hp<S.maxhp,buy:()=>{S.hp=S.maxhp;}},
 {id:'cuore',name:'Frammento di Cuore',desc:'Un quarto di cuore, un po\' ammaccato.',price:60,once:1,buy:()=>{ closeShop(); gainPiece(); }},
 {id:'barattolo',name:'Lucciola in barattolo',desc:'«L\'ho trovata nel mio guscio. Non chiedere.»',price:45,once:1,buy:()=>{ closeShop(); gainFirefly(); }},
 {id:'bussola',name:'Bussola delle Lucciole',desc:'Mostra sulla mappa le stanze con lucciole ancora da trovare.',price:40,once:1,buy:()=>{ S.flags.bussola=1; }}
];
