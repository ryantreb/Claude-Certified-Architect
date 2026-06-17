/* Pass 16: the original castle rooms and quest lines.
   DATA.eaRooms hangs the CastleRoom_*_MC backdrops over the keep cards;
   DATA.eaQuests threads the original campaign (Prove Yourself → Witch Hunt →
   The Deep Roads…) through each region as flavor over the study objectives.
   Quest names surface on the objective chip, region arrivals and a campaign
   card — purely narrative dressing over the same mastery-driven progression. */
const fs=require('fs');
const F='/home/user/Claude-Certified-Architect/index.html';
let h=fs.readFileSync(F,'utf8');
function rep(a,b,tag){
  const i=h.indexOf(a);
  if(i<0)throw new Error('anchor missing: '+tag);
  if(h.indexOf(a,i+1)>=0)throw new Error('anchor not unique: '+tag);
  h=h.slice(0,i)+b+h.slice(i+a.length);
}

/* 1: payloads */
rep(`/* enemy stat medians from the original CHARACTER_CHARCLASS.xml, keyed by foe shape`,
fs.readFileSync('/tmp/dal/rooms_lit.js','utf8').trim()+'\n'+
fs.readFileSync('/tmp/dal/quests_lit.js','utf8').trim()+`
/* enemy stat medians from the original CHARACTER_CHARCLASS.xml, keyed by foe shape`,'payloads');

/* 2: room banner style */
rep(`#btnMapClose{position:absolute;left:50%;transform:translateX(-50%);bottom:10px}`,
`#btnMapClose{position:absolute;left:50%;transform:translateX(-50%);bottom:10px}
.kroom{display:block;width:100%;height:84px;object-fit:cover;object-position:center 28%;border-radius:8px;margin:2px 0 9px;border:1px solid #3a3354;filter:saturate(.96)}`,'room css');

/* 3: quest plumbing */
rep(`function companionFor(regionId){`,
`/* ---- the original campaign, bound to the study regions ----
   region index -> original quest chain; progress maps wins+boss onto the
   chain so each victory turns the next page. Reading is all it ever does. */
const QUESTBIND=["PP","PF","GD","WS","OR"];
function questChainOf(r){
  if(!DATA.eaQuests||!r)return [];
  const order=DATA.regions.filter(x=>x.cert===r.cert).map(x=>x.id);
  const i=order.indexOf(r.id);
  return DATA.eaQuests[QUESTBIND[i]||""]||[];
}
function regionQuestNow(r){
  const chain=questChainOf(r);
  if(!chain.length)return null;
  const st=S.regions[r.id]||{wins:0,boss:false};
  const idx=Math.min(chain.length-1,(st.wins||0)+(st.boss?chain.length:0));
  return chain[Math.min(idx,chain.length-1)];
}
function companionFor(regionId){`,'quest plumbing');

/* 4: the objective chip carries the original quest name */
rep(`    if(st.wins<3)return {text:r.name+": defeat corrupted foes ("+st.wins+"/3)",region:r,kind:"fight"};
    return {text:r.name+": challenge "+DATA.enemies[r.boss].name+" at the rift",region:r,kind:"boss"};`,
`    const oq=regionQuestNow(r);
    const tag=oq?"「"+oq.n+"」 ":"";
    if(st.wins<3)return {text:tag+r.name+": defeat corrupted foes ("+st.wins+"/3)",region:r,kind:"fight"};
    return {text:tag+r.name+": challenge "+DATA.enemies[r.boss].name+" at the rift",region:r,kind:"boss"};`,'objective quest');

/* 5: region arrival speaks the original opening */
rep(`  if(!regState(r.id).introSeen){
    regState(r.id).introSeen=true;
    toast(r.intro);
  }`,
`  if(!regState(r.id).introSeen){
    regState(r.id).introSeen=true;
    toast(r.intro);
    const oq=(questChainOf(r)||[])[0];
    if(oq){Sfx.ea("QuestStart",0.8);
      setTimeout(()=>{toast("Original campaign — “"+oq.n+"”: "+(oq.t||"the road opens."),true)},1700)}
  }`,'arrival quest');

/* 6: room art over the keep cards */
rep(`  html+="<div class='kcard'><h3>The Hero Room</h3>`,
`  html+="<div class='kcard'><img class='kroom' src='"+DATA.eaRooms.heroRoom.d+"' alt=''><h3>The Hero Room</h3>`,'heroRoom art');

rep(`  html+="<div class='kcard'><h3>The Armory</h3>"`,
`  html+="<div class='kcard'><img class='kroom' src='"+DATA.eaRooms.training.d+"' alt=''><h3>The Armory</h3>"`,'armory art');

rep(`  html+="<div class='kcard'><h3>The Vault</h3>"`,
`  html+="<div class='kcard'><img class='kroom' src='"+DATA.eaRooms.treasury.d+"' alt=''><h3>The Vault</h3>"`,'vault art');

rep(`  html+="<div class='kcard'><h3>Companions sworn ("+S.companions.length+"/11)</h3>";`,
`  html+="<div class='kcard'><img class='kroom' src='"+DATA.eaRooms.tavern.d+"' alt=''><h3>Companions sworn ("+S.companions.length+"/11)</h3>";`,'tavern art');

rep(`  let html="<div class='kcard'><h3>Chronicle</h3>";`,
`  let html="<div class='kcard'><img class='kroom' src='"+DATA.eaRooms.greatHall.d+"' alt=''><h3>Chronicle</h3>";`,'hall art');

rep(`  html+="<div class='kcard'><h3>Standing orders</h3>";`,
`  html+="<div class='kcard'><img class='kroom' src='"+DATA.eaRooms.throne.d+"' alt=''><h3>Standing orders</h3>";`,'throne art');

rep(`  let html="<div class='kcard'><h3>Aether shards: <span class='gold'>"+S.shards+"</span></h3>`,
`  let html="<div class='kcard'><img class='kroom' src='"+DATA.eaRooms.market.d+"' alt=''><h3>Aether shards: <span class='gold'>"+S.shards+"</span></h3>`,'market art');

rep(`    return "<div class='kcard'><h3>The Library lies in ruin</h3>`,
`    return "<div class='kcard'><img class='kroom' src='"+DATA.eaRooms.library.d+"' alt=''><h3>The Library lies in ruin</h3>`,'library art');

rep(`  html+="<div class='kcard'><h3>Session</h3>`,
`  html+="<div class='kcard'><img class='kroom' src='"+DATA.eaRooms.infirmary.d+"' alt=''><h3>Session</h3>`,'infirmary art');

/* 7: the campaign card on the quests tab */
rep(`  html+="<div class='kcard'><div class='small dim'>Beyond both questlines: the Crossweave region and the Twin Trial — overlap concepts, served through whichever craft you carry.</div></div>";
  return html;
}`,
`  html+="<div class='kcard'><img class='kroom' src='"+DATA.eaRooms.alchemy.d+"' alt=''><h3>The campaign — original quest lines</h3>";
  trackRegions(S.track).forEach(r=>{
    const chain=questChainOf(r);if(!chain.length)return;
    const st=S.regions[r.id]||{wins:0,boss:false};
    const done=st.boss?chain.length:Math.min(chain.length,st.wins||0);
    html+="<div class='statline'><span><b>"+esc(r.name)+"</b></span><span class='small dim'>"+done+"/"+chain.length+"</span></div>";
    html+="<div class='small dim' style='margin:0 0 6px 6px'>"+chain.map((q,i)=>
      (i<done?"<span class='good'>✓ "+esc(q.n)+"</span>":(i===done&&!st.boss?"<b>▸ "+esc(q.n)+"</b>":"<span style='opacity:.55'>"+esc(q.n)+"</span>"))).join(" · ")+"</div>";
  });
  html+="<div class='small dim'>The old campaign turns its pages as your recalls win battles — names and words from the original, progress from mastery alone.</div></div>";
  html+="<div class='kcard'><div class='small dim'>Beyond both questlines: the Crossweave region and the Twin Trial — overlap concepts, served through whichever craft you carry.</div></div>";
  return html;
}`,'campaign card');

/* 8: bridge */
rep(`  vaultState, rollItemDrop, gearHitBonus, gearGuardBonus, gearCritBonus, gearHpBonus, gearManaBonus, wornItems,`,
`  vaultState, rollItemDrop, gearHitBonus, gearGuardBonus, gearCritBonus, gearHpBonus, gearManaBonus, wornItems,
  questChainOf, regionQuestNow, get QUESTBIND(){return QUESTBIND},`,'bridge');

fs.writeFileSync(F,h);
const blocks=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
let bad=0;blocks.forEach((s,i)=>{try{new Function(s)}catch(e){console.log('SYNTAX ERR block',i,e.message);bad++}});
console.log(bad?'FAILED':'ok -',(h.length/1048576).toFixed(1)+'MB,',blocks.length,'blocks');
