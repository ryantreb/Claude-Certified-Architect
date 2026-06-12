/* Pass 20: the Creation Hall and the earned drink.
   - Question card (battle card) gains a size setting (S/M/L/XL).
   - Champion portraits center themselves (runtime alpha-crop to content).
   - The hall opens to Legends & Terrors: eight monsters/villains as playable
     champions with their original CHARCLASS-derived stats riding the d20.
   - A name for the champion (presentation only).
   - Poultice and mana are EARNED: drinkable only as the action a correct
     answer just bought, and drinking spends it (honesty: knowledge controls
     the action economy).
   - The ×N chip names itself: it is the answer-streak damage multiplier. */
const fs=require('fs');
const F='/home/user/Claude-Certified-Architect/index.html';
let h=fs.readFileSync(F,'utf8');
function rep(a,b,tag){
  const i=h.indexOf(a);
  if(i<0)throw new Error('anchor missing: '+tag);
  if(h.indexOf(a,i+1)>=0)throw new Error('anchor not unique: '+tag);
  h=h.slice(0,i)+b+h.slice(i+a.length);
}

/* 1: defaults */
rep(`settings:{sound:true,music:true,motion:true,dpad:false}`,
`settings:{sound:true,music:true,motion:true,dpad:false,qscale:"m"},heroName:""`,'defaults');

/* 2: the chip explains itself */
rep(`<span id="comboChip">×1.0</span>`,
`<span id="comboChip" title="Answer streak — multiplies tactical damage only. Mastery and meters never ride it.">streak ×1.0</span>`,'chip html');

rep(`  $("comboChip").textContent="×"+B.combo.toFixed(2).replace(/0$/,"");`,
`  $("comboChip").textContent="streak ×"+B.combo.toFixed(2).replace(/0$/,"");`,'chip text');

/* 3: question-card size */
rep(`  return row("music","Music","The original loops — castle, quest, battle")+
         row("sound","Sound","The original strikes, spells and voices")+
         row("motion","Motion & shake","Disable for reduced motion")+
         row("dpad","On-screen d-pad","Tap-to-move always works regardless");`,
`  const q=S.settings.qscale||"m";
  const QL={s:"Small",m:"Medium",l:"Large",x:"Extra large"};
  return row("music","Music","The original loops — castle, quest, battle")+
         row("sound","Sound","The original strikes, spells and voices")+
         row("motion","Motion & shake","Disable for reduced motion")+
         row("dpad","On-screen d-pad","Tap-to-move always works regardless")+
         "<div class='setrow'><div style='flex:1'><div class='slab'>Question card size</div><div class='ssub'>How large the battle card reads</div></div>"+
         "<button class='btn sm ghost' data-act='qsize'>"+QL[q]+"</button></div>";`,'qsize row');

rep(`      else if(act==="tgl"){const k=el.dataset.k;S.settings[k]=!S.settings[k];applySettings()}`,
`      else if(act==="tgl"){const k=el.dataset.k;S.settings[k]=!S.settings[k];applySettings()}
      else if(act==="qsize"){
        const order=["s","m","l","x"],QL={s:"Small",m:"Medium",l:"Large",x:"Extra large"};
        S.settings.qscale=order[(order.indexOf(S.settings.qscale||"m")+1)%order.length];
        el.textContent=QL[S.settings.qscale];applySettings();queueSave();
      }`,'qsize act');

rep(`function applySettings(){
  document.body.classList.toggle("nomotion",!S.settings.motion);
  if(S.settings.music===false)Music.stop();else Music.sync();
  $("dpad").classList.toggle("hidden",!S.settings.dpad||MODE==="title");
}`,
`function applySettings(){
  document.body.classList.toggle("nomotion",!S.settings.motion);
  if(S.settings.music===false)Music.stop();else Music.sync();
  $("dpad").classList.toggle("hidden",!S.settings.dpad||MODE==="title");
  const z={s:0.85,m:1,l:1.18,x:1.35}[S.settings.qscale||"m"]||1;
  $("battleBox").style.zoom=z;
}`,'qsize apply');

/* 4: poultice and mana are earned actions */
rep(`function useTonic(){
  if(!B||B.gauntlet||S.consume.tonic<1)return;
  const hurt=livingParty().sort((a,b)=>(a.halves/a.max)-(b.halves/b.max))[0];
  if(!hurt||hurt.halves>=hurt.max){toast("The party stands unhurt.");return}
  S.consume.tonic--;hurt.halves=Math.min(hurt.max,hurt.halves+3);
  {const mi=B.party.indexOf(hurt);const at=mi>=0?fxAtMember(mi):null;
   if(at)spawnFx("heal",at.x,at.y,{scale:0.9});}
  Sfx.ea("vfx_spells_vfx_new_spirit_fxa_heal_conj_c_imp_n_000",0.7);
  addFloater("+1.5♥",0.3,-70,"#7fe09a",15);
  Sfx.play("open");updateBattleHUD();queueSave();
}
function useDraught(){
  if(!B||B.gauntlet||S.consume.draught<1)return;
  if(B.mana>=B.manaMax){toast("Your mana is already full.");return}
  S.consume.draught--;B.mana=Math.min(B.manaMax,B.mana+2);
  addFloater("+2☄",0.3,-70,"#9fd0f0",15);
  Sfx.play("open");updateBattleHUD();queueSave();
  if(B.phase==="act")showActions();
}`,
`/* drinking is an ACTION, and actions are earned by recall: a consumable can
   only be used in place of the strike a correct answer just bought, and
   using it spends that action (immutable rule 6 kin: tactics never outpace
   knowledge). */
function useTonic(){
  if(!B||B.gauntlet||S.consume.tonic<1)return;
  if(B.phase!=="pick"){toast("Acting is earned — answer truly first, then drink as that action.");return}
  const hurt=livingParty().sort((a,b)=>(a.halves/a.max)-(b.halves/b.max))[0];
  if(!hurt||hurt.halves>=hurt.max){toast("The party stands unhurt.");return}
  S.consume.tonic--;hurt.halves=Math.min(hurt.max,hurt.halves+3);
  {const mi=B.party.indexOf(hurt);const at=mi>=0?fxAtMember(mi):null;
   if(at)spawnFx("heal",at.x,at.y,{scale:0.9});}
  Sfx.ea("vfx_spells_vfx_new_spirit_fxa_heal_conj_c_imp_n_000",0.7);
  addFloater("+1.5♥",0.3,-70,"#7fe09a",15);
  Sfx.play("open");
  B.phase="fb";revealContinue();          /* the earned action is spent */
  updateBattleHUD();queueSave();
}
function useDraught(){
  if(!B||B.gauntlet||S.consume.draught<1)return;
  if(B.phase!=="pick"){toast("Acting is earned — answer truly first, then drink as that action.");return}
  if(B.mana>=B.manaMax){toast("Your mana is already full.");return}
  S.consume.draught--;B.mana=Math.min(B.manaMax,B.mana+2);
  addFloater("+2☄",0.3,-70,"#9fd0f0",15);
  Sfx.play("open");
  B.phase="fb";revealContinue();          /* the earned action is spent */
  updateBattleHUD();queueSave();
}`,'earned drinks');

rep(`  $("btnTonic").disabled=S.consume.tonic<1;
  $("btnDraught").disabled=S.consume.draught<1;`,
`  const canAct=B.phase==="pick";
  $("btnTonic").disabled=S.consume.tonic<1||!canAct;
  $("btnDraught").disabled=S.consume.draught<1||!canAct;
  $("btnTonic").title=canAct?"Heals the most wounded ally +1.5 hearts — spends this action":"Earned by a correct answer — drink in place of your strike";
  $("btnDraught").title=canAct?"Restores 2 mana — spends this action":"Earned by a correct answer — drink in place of your strike";`,'drink gating');

/* 5: legends & terrors join the roster, original stats riding the d20 */
rep(`function heroChoice(){return (S.hero&&HERO_CHOICES.find(c=>c.rig===S.hero.rig))||null}`,
`/* monsters and villains as champions: original rigs, original stat rows
   (eaStats medians / villain CHARCLASS rows) shaping the same d20 */
const LEGEND_CHOICES=[
  {rig:"beirus",cls:"vanguard",stat:"beirus",shape:"beirus",name:"Beirus",weapon:"Corrupted might",d:"the deep roads' terror — a dwarf lord remade by the taint"},
  {rig:"shale",cls:"vanguard",stat:"golem",shape:"golem",name:"Shale",weapon:"Living stone",d:"the old guild's golem, sardonic and unbreakable"},
  {rig:"ogre",cls:"vanguard",stat:"ogre",shape:"ogre",name:"Ogre",weapon:"Sheer mass",d:"a horned mountain of darkspawn muscle"},
  {rig:"tianne",cls:"shadow",stat:"tianne",shape:"tianne",name:"Tianne",weapon:"Claw and root",d:"the vineyard's red mistress, fought and now worn"},
  {rig:"werewolf",cls:"shadow",stat:"werewolf",shape:"werewolf",name:"Werewolf",weapon:"Fang and fury",d:"the Dales' curse on two legs"},
  {rig:"soleil",cls:"caster",stat:"soleil",shape:"soleil",name:"Soleil",weapon:"Demon pacts",d:"the witch of the Planasene, demons at heel"},
  {rig:"desire",cls:"caster",stat:"banshee",shape:"banshee",name:"Desire Demon",weapon:"Beguiling flame",d:"the Fade's sweetest lie"},
  {rig:"dragon",cls:"ranger",stat:"dragon",shape:"dragon",name:"Fire Drake",weapon:"Dragonfire",d:"wings, scale and appetite"}];
function heroChoice(){
  if(!S.hero)return null;
  return HERO_CHOICES.find(c=>c.rig===S.hero.rig)||LEGEND_CHOICES.find(c=>c.rig===S.hero.rig)||null;
}
function heroLegend(){return (S.hero&&LEGEND_CHOICES.find(c=>c.rig===S.hero.rig))||null}
/* the original stat row a legend champion brings to the d20 */
function legendRec(){
  const L=heroLegend();if(!L)return null;
  const s=DATA.eaStats&&DATA.eaStats[L.stat];if(!s)return null;
  return {atk:s.atk,df:s.def,agi:s.agi,hp:s.hp};
}
function legendHpBonus(){
  const r=legendRec();if(!r)return 0;
  return clamp(Math.round((r.hp-12)/2.5),-2,8);
}`,'legends');

rep(`  arr.forEach(m=>{m.max=memberHalves(m.cls)+(m.kind==="hero"?gearHpBonus():0);m.halves=m.max});`,
`  arr.forEach(m=>{m.max=memberHalves(m.cls)+(m.kind==="hero"?gearHpBonus()+legendHpBonus():0);m.halves=m.max});`,'legend hp');

rep(`function atkBonusOf(m){
  const r=eaCompRec(m);
  return 4+wieldHitBonus(m)+gearHitBonus(m)+(r?Math.round(r.atk/12):0)
    +(typeof summonHitBonus==="function"?summonHitBonus():0);
}`,
`function atkBonusOf(m){
  const r=eaCompRec(m)||(m&&m.kind==="hero"?legendRec():null);
  return 4+wieldHitBonus(m)+gearHitBonus(m)+(r?Math.round(r.atk/12):0)
    +(typeof summonHitBonus==="function"?summonHitBonus():0);
}`,'legend atk');

rep(`function guardBonusOf(m){
  const r=eaCompRec(m);
  return 3+(m&&m.cls==="vanguard"?2:0)+wieldGuardBonus(m)+gearGuardBonus(m)+(r?Math.round(r.df/12):0);
}`,
`function guardBonusOf(m){
  const r=eaCompRec(m)||(m&&m.kind==="hero"?legendRec():null);
  return 3+(m&&m.cls==="vanguard"?2:0)+wieldGuardBonus(m)+gearGuardBonus(m)+(r?Math.round(r.df/12):0);
}`,'legend guard');

rep(`function critRangeOf(m,sk){
  const r=eaCompRec(m);
  return Math.max(16,20-(sk&&sk.crit?4:0)-wieldCritBonus(m)-gearCritBonus(m)-(r&&r.agi>=16?1:0));
}`,
`function critRangeOf(m,sk){
  const r=eaCompRec(m)||(m&&m.kind==="hero"?legendRec():null);
  return Math.max(16,20-(sk&&sk.crit?4:0)-wieldCritBonus(m)-gearCritBonus(m)-(r&&r.agi>=16?1:0));
}`,'legend crit');

rep(`  arr=[{kind:"hero",name:"The Architect",cls:hcls,hitT:-9,cell:{col:0,row:1}}];`.replace('  arr=','  const arr='),
`  const L=(typeof heroLegend==="function")&&heroLegend();
  const arr=[{kind:"hero",name:S.heroName||(L?L.name:"The Architect"),cls:hcls,hitT:-9,cell:{col:0,row:1}}];`,'hero name');

rep(`function heroBark(kind){
  const hc=heroChoice();
  const fem=hc?(hc.rig==="heroRog"||hc.rig==="heroArc"):true;`,
`function heroBark(kind){
  const L=heroLegend();
  if(L){ /* legends grunt in their own voices, or keep their silence */
    if(kind==="pain"&&FOEPAIN[L.shape])Sfx.ea(pick(FOEPAIN[L.shape]),0.5);
    else if(kind==="death"&&FOEDIE[L.shape])Sfx.ea(FOEDIE[L.shape],0.6);
    return;
  }
  const hc=heroChoice();
  const fem=hc?(hc.rig==="heroRog"||hc.rig==="heroArc"):true;`,'legend bark');

/* 6: centered portraits + the Creation Hall */
rep(`.herocard img{width:64px;height:64px;border-radius:10px;border:1px solid #5a4a72;object-fit:cover;background:#241d33}`,
`.herocard img{width:64px;height:64px;border-radius:10px;border:1px solid #5a4a72;object-fit:contain;background:#241d33}
.hallSec{margin:14px 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#d9a441}
.hallName{width:100%;margin-top:10px;padding:9px 10px;border-radius:9px;border:1px solid #4d4470;background:rgba(20,16,33,.7);color:#e8deca;font-size:14px}
.hallNote{font-size:11px;color:#8d8470;line-height:1.4;margin-top:10px}`,'hall css');

rep(`function chooseHero(after,isNew){
  Music.go("party");
  let html="<h2 class='serif'>"+(isNew?"Choose your champion":"The Hero Room")+"</h2>"+
    "<p class='small dim'>The four disciplines of the old game, faces straight from its creation-hall presets. Skills and art follow the choice; your mastery never moves with it.</p>"+
    "<div class='heroGrid'>";
  HERO_CHOICES.forEach(c=>{
    const cur=S.hero&&S.hero.rig===c.rig;
    const p=EARIG[c.rig]&&EARIG[c.rig].portrait;
    html+="<button class='herocard"+(cur?" herocur":"")+"' data-hero='"+c.rig+"'>"+
      (p&&p.src?"<img src='"+p.src+"' alt=''>":"")+
      "<b>"+esc(c.name)+"</b><i>"+esc(c.weapon)+"</i>"+
      "<span>"+esc(c.d)+"</span>"+
      "<span class='small dim'>"+esc(SKILLS[c.cls].map(s=>s.n).join(" · "))+"</span>"+
      (cur?"<span class='good small'>current</span>":"")+
      "</button>";
  });
  html+="</div>";
  showModal(html,[{label:isNew?"Decide later — ride with Deymour":"Keep as is",cls:"ghost",fn:()=>{Music.sync();if(after)after()}}]);
  $("modalBox").querySelectorAll("[data-hero]").forEach(b=>{
    b.addEventListener("click",()=>{
      const c=HERO_CHOICES.find(x=>x.rig===b.dataset.hero);
      if(!c)return;
      S.hero={rig:c.rig,cls:c.cls};
      closeModal();Music.sync();Sfx.play("levelup");Sfx.ea("da_flash_equip1_sgl",0.8);
      toast("The "+c.name+" takes up the work — "+c.weapon.toLowerCase()+" in hand.",true);
      queueSave();
      if(after)after();
    });
  });
}`,
`/* a portrait cropped to its painted content and centered on a square —
   the raw symbol exports carry uneven framing */
const PORTCACHE={};
function portraitSquare(rigKey){
  if(PORTCACHE[rigKey])return PORTCACHE[rigKey];
  const rec=EARIG[rigKey],img=rec&&rec.portrait;
  if(!img||!img.src)return "";
  if(!img.complete||!img.naturalWidth)return img.src;
  try{
    const w=img.naturalWidth,hh=img.naturalHeight;
    const cv=document.createElement("canvas");cv.width=w;cv.height=hh;
    const cx=cv.getContext("2d");cx.drawImage(img,0,0);
    const d=cx.getImageData(0,0,w,hh).data;
    let x0=w,y0=hh,x1=0,y1=0,found=false;
    for(let y=0;y<hh;y++)for(let x=0;x<w;x++)
      if(d[(y*w+x)*4+3]>10){found=true;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
    if(!found)return img.src;
    const bw=x1-x0+1,bh=y1-y0+1,side=Math.max(bw,bh);
    const out=document.createElement("canvas");out.width=side;out.height=side;
    out.getContext("2d").drawImage(cv,x0,y0,bw,bh,(side-bw)/2,(side-bh)/2,bw,bh);
    return PORTCACHE[rigKey]=out.toDataURL("image/png");
  }catch(e){return img.src}
}
function heroCardHtml(c,extra){
  const cur=S.hero&&S.hero.rig===c.rig;
  const p=portraitSquare(c.rig);
  return "<button class='herocard"+(cur?" herocur":"")+"' data-hero='"+c.rig+"'>"+
    (p?"<img src='"+p+"' alt=''>":"")+
    "<b>"+esc(c.name)+"</b><i>"+esc(c.weapon)+"</i>"+
    "<span>"+esc(c.d)+"</span>"+
    "<span class='small dim'>"+esc(extra)+"</span>"+
    (cur?"<span class='good small'>current</span>":"")+
    "</button>";
}
function chooseHero(after,isNew){
  Music.go("party");
  let html="<h2 class='serif'>"+(isNew?"The Creation Hall":"The Hero Room")+"</h2>"+
    "<p class='small dim'>Every champion aboard, faces and rigs straight from the old game. Skills and art follow the choice; your mastery never moves with it.</p>";
  html+="<div class='hallSec'>The four disciplines</div><div class='heroGrid'>";
  HERO_CHOICES.forEach(c=>{html+=heroCardHtml(c,SKILLS[c.cls].map(s=>s.n).join(" · "))});
  html+="</div><div class='hallSec'>Legends &amp; terrors</div><div class='heroGrid'>";
  LEGEND_CHOICES.forEach(c=>{
    const s=DATA.eaStats[c.stat]||{};
    html+=heroCardHtml(c,(CLSNAME[c.cls]||c.cls)+" frame · atk "+(s.atk||"?")+" · def "+(s.def||"?")+" · agi "+(s.agi||"?"));
  });
  html+="</div>";
  html+="<input class='hallName' id='hallName' maxlength='24' placeholder='Name the champion (optional)' value='"+esc(S.heroName||"")+"'>";
  html+="<div class='hallNote'>The old game dressed its heroes from thousands of Flash piece combinations (skins × hair × armors per body). Those are baked offline here — every preset above is a true original; more can be composed on request.</div>";
  showModal(html,[{label:isNew?"Decide later — ride with Deymour":"Keep as is",cls:"ghost",fn:()=>{saveHallName();Music.sync();if(after)after()}}]);
  function saveHallName(){
    const el=$("hallName");if(!el)return;
    S.heroName=(el.value||"").replace(/[<>&"']/g,"").slice(0,24).trim();
  }
  $("modalBox").querySelectorAll("[data-hero]").forEach(b=>{
    b.addEventListener("click",()=>{
      const c=HERO_CHOICES.find(x=>x.rig===b.dataset.hero)||LEGEND_CHOICES.find(x=>x.rig===b.dataset.hero);
      if(!c)return;
      saveHallName();
      S.hero={rig:c.rig,cls:c.cls};
      closeModal();Music.sync();Sfx.play("levelup");Sfx.ea("da_flash_equip1_sgl",0.8);
      toast((S.heroName||c.name)+" takes up the work — "+c.weapon.toLowerCase()+" in hand.",true);
      queueSave();
      if(after)after();
    });
  });
}`,'creation hall');

/* 7: bridge */
rep(`  castSummon, summonHitBonus, battleXp, xpNeed,`,
`  castSummon, summonHitBonus, battleXp, xpNeed,
  portraitSquare, useTonic, useDraught, applySettings, buildParty, legendRec, legendHpBonus,
  get LEGEND_CHOICES(){return LEGEND_CHOICES},`,'bridge');

fs.writeFileSync(F,h);
const blocks=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
let bad=0;blocks.forEach((s,i)=>{try{new Function(s)}catch(e){console.log('SYNTAX ERR block',i,e.message);bad++}});
console.log(bad?'FAILED':'ok -',(h.length/1048576).toFixed(1)+'MB,',blocks.length,'blocks');
