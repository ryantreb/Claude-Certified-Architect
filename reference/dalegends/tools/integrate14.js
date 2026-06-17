/* Pass 14: the original guild companions.
   DATA.eaComp carries the CHARACTER_GUILDNPCS roster verbatim (stats,
   warcries, portraits). They join through play milestones (bosses, levels,
   streaks, trials, caches, mastery counts — all read-only derivations of
   existing state), drink in the Tavern card, and ride beside the study
   companions. Their numbers sharpen the d20 only — atk→hit, def→guard,
   agility→crit — and never touch mastery or meters. */
const fs=require('fs');
const F='/home/user/Claude-Certified-Architect/index.html';
let h=fs.readFileSync(F,'utf8');
function rep(a,b,tag){
  const i=h.indexOf(a);
  if(i<0)throw new Error('anchor missing: '+tag);
  if(h.indexOf(a,i+1)>=0)throw new Error('anchor not unique: '+tag);
  h=h.slice(0,i)+b+h.slice(i+a.length);
}

/* 1: payload */
rep(`/* enemy stat medians from the original CHARACTER_CHARCLASS.xml, keyed by foe shape`,
fs.readFileSync('/tmp/dal/comp_payload_lit.js','utf8').trim()+`
/* enemy stat medians from the original CHARACTER_CHARCLASS.xml, keyed by foe shape`,'comp payload');

/* 2: join rules + merged roster */
rep(`/* sworn companions of the active track; an explicit roster choice wins,
   otherwise the first two sworn ride (the old behavior) */
function activeCompanions(){
  const all=S.companions.map(id=>DATA.companions.find(c=>c.id===id)).filter(c=>c&&c.cert===S.track);
  const sel=(S.activeComp&&S.activeComp[S.track])||[];
  const chosen=sel.map(id=>all.find(c=>c.id===id)).filter(Boolean);
  return chosen.length?chosen:all;
}`,
`/* ---- the original guild roster: joined by play, read-only milestones ---- */
function masteredTotal(){
  let n=0;
  for(const cert of ["c","g"])meterOf(cert).per.forEach(d=>{n+=d.mastered});
  return n;
}
function eaCompJoined(c){
  const j=c.joins||{};
  switch(j.t){
    case "boss":{const r=trackRegions(S.track)[j.i];return !!(r&&(S.regions[r.id]||{}).boss)}
    case "level":return S.level>=j.n;
    case "streak":return S.streak.count>=j.n;
    case "trial":return !!(S.badges.c||S.badges.g);
    case "caches":{let n=0;for(const id in S.regions){const cc=S.regions[id].cache;if(cc)n+=cc.filter(Boolean).length}return n>=6}
    case "masters":return masteredTotal()>=j.n;
    case "perfectExam":return !!(S.feats&&S.feats.perfectExam);
    default:return false;
  }
}
function eaCompRoster(){return (DATA.eaComp||[]).filter(eaCompJoined)}
function eaCompJoinHint(c){
  const j=c.joins||{};
  switch(j.t){
    case "boss":{const r=trackRegions(S.track)[j.i];return "fell the terror of "+(r?r.name:"a region")}
    case "level":return "reach level "+j.n;
    case "streak":return "hold a "+j.n+"-day vigil";
    case "trial":return "pass a certification trial";
    case "caches":return "uncover six hidden caches";
    case "masters":return "master "+j.n+" concepts";
    case "perfectExam":return "score a perfect practical (1000/1000)";
    default:return "unknown deed";
  }
}
/* sworn companions of the active track; an explicit roster choice wins,
   otherwise the first two sworn ride (the old behavior) */
function activeCompanions(){
  const study=S.companions.map(id=>DATA.companions.find(c=>c.id===id)).filter(c=>c&&c.cert===S.track);
  const all=study.concat(eaCompRoster());
  const sel=(S.activeComp&&S.activeComp[S.track])||[];
  const chosen=sel.map(id=>all.find(c=>c.id===id)).filter(Boolean);
  return chosen.length?chosen:study;
}`,'roster');

/* 3: the party honors original classes */
rep(`  activeCompanions().slice(0,2)
    .forEach((c,i)=>arr.push({kind:"comp",id:c.id,name:c.name.split(",")[0],cls:CLSOF[c.id]||"vanguard",`,
`  activeCompanions().slice(0,2)
    .forEach((c,i)=>arr.push({kind:"comp",id:c.id,name:c.name.split(",")[0],cls:CLSOF[c.id]||c.cls||"vanguard",`,'party cls');

/* 4: original numbers sharpen the d20 (tactical only) */
rep(`function atkBonusOf(m){return 4+wieldHitBonus(m)}`,
`/* an original companion's CHARACTER_GUILDNPCS stats ride the die: tactical only */
function eaCompRec(m){return (m&&m.kind==="comp"&&DATA.eaComp)?DATA.eaComp.find(c=>c.id===m.id):null}
function atkBonusOf(m){
  const r=eaCompRec(m);
  return 4+wieldHitBonus(m)+(r?Math.round(r.atk/12):0);
}`,'atk bonus');

rep(`function guardBonusOf(m){return 3+(m&&m.cls==="vanguard"?2:0)+wieldGuardBonus(m)}`,
`function guardBonusOf(m){
  const r=eaCompRec(m);
  return 3+(m&&m.cls==="vanguard"?2:0)+wieldGuardBonus(m)+(r?Math.round(r.df/12):0);
}`,'guard bonus');

rep(`function critRangeOf(m,sk){return Math.max(16,20-(sk&&sk.crit?4:0)-wieldCritBonus(m))}`,
`function critRangeOf(m,sk){
  const r=eaCompRec(m);
  return Math.max(16,20-(sk&&sk.crit?4:0)-wieldCritBonus(m)-(r&&r.agi>=16?1:0));
}`,'crit bonus');

/* 5: a warcry on the wind when an original rides into battle */
rep(`  FXQ.anims.length=0;FXQ.parts.length=0;
  spawnFx(cfg.boss?"bFinalWave":"bGetReady",0,0,{banner:true});`,
`  FXQ.anims.length=0;FXQ.parts.length=0;
  {const ogc=B.party.find(m=>m.kind==="comp"&&DATA.eaComp&&DATA.eaComp.some(c=>c.id===m.id));
   if(ogc){const rec=DATA.eaComp.find(c=>c.id===ogc.id);
     if(rec&&Math.random()<0.5)setTimeout(()=>{if(B)toast("“"+rec.warcry+"” — "+rec.name)},900)}}
  spawnFx(cfg.boss?"bFinalWave":"bGetReady",0,0,{banner:true});`,'warcry');

/* 6: the Tavern — the original roster in the companions card */
rep(`  if(S.companions.length)html+="<div class='small dim' style='margin-top:6px'>Two ride at a time on the active track; their strikes answer to the same recall rules as yours.</div>";
  html+="</div>";`,
`  if(S.companions.length)html+="<div class='small dim' style='margin-top:6px'>Two ride at a time on the active track; their strikes answer to the same recall rules as yours.</div>";
  html+="<div class='divider'></div><h3>The Tavern — guild companions</h3>";
  const ridingNow=activeCompanions().slice(0,2).map(c=>c.id);
  (DATA.eaComp||[]).forEach(c=>{
    const joined=eaCompJoined(c);
    const on=joined&&ridingNow.includes(c.id);
    html+="<div class='statline'"+(joined?"":" style='opacity:.55'")+"><span>"+
      "<img src='"+c.port+"' alt='' style='width:26px;height:26px;border-radius:5px;vertical-align:middle;margin-right:7px;border:1px solid #5a4a72'>"+
      "<b>"+esc(c.name)+"</b> <span class='small dim'>"+esc(c.race)+" "+CLSNAME[c.cls]+" · "+esc(c.skill)+"</span></span>"+
      "<span>"+(joined
        ?"<button class='btn sm "+(on?"primary":"ghost")+"' data-act='comp' data-id='"+c.id+"' style='margin-left:8px'>"+(on?"riding along":"bench")+"</button>"
        :"<span class='small dim'>"+esc(eaCompJoinHint(c))+"</span>")+
      "</span></div>";
  });
  html+="<div class='small dim' style='margin-top:6px'>The old guild answers deeds, not coin: bosses felled, vigils held, trials passed. Their arms sharpen the d20 only — mastery never rides along.</div>";
  html+="</div>";`,'tavern');

/* 7: a perfect practical is a remembered feat (tactical state only) */
rep(`  if(wasBoss&&B.exam&&B.exam.length)html+=practicalReportHtml(B.exam,B.cert);`,
`  if(wasBoss&&B.exam&&B.exam.length){
    const gport=gradePractical(B.exam,B.cert);
    if(gport.score>=1000){S.feats=S.feats||{};S.feats.perfectExam=1}
    html+=practicalReportHtml(B.exam,B.cert);
  }`,'perfect feat');

/* 8: bridge */
rep(`  openWorldMap, closeWorldMap, mapPlaceOf, get MAPBIND(){return MAPBIND},`,
`  openWorldMap, closeWorldMap, mapPlaceOf, get MAPBIND(){return MAPBIND},
  eaCompJoined, eaCompRoster, masteredTotal, eaCompRec,`,'bridge');

fs.writeFileSync(F,h);
const blocks=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
let bad=0;blocks.forEach((s,i)=>{try{new Function(s)}catch(e){console.log('SYNTAX ERR block',i,e.message);bad++}});
console.log(bad?'FAILED':'ok -',(h.length/1048576).toFixed(1)+'MB,',blocks.length,'blocks');
