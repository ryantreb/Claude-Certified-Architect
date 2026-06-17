/* Pass 11: the original soundscape.
   DATA.eaSnd carries every sound effect from audio.swf verbatim; DATA.eaMusic
   the original loops (CastleLoop/ChoosePartyLoop/CombatLoop/QuestLoop +
   deep_roads). Sfx grows a sample player (synth stays as fallback); Music
   follows the screen the way the original scored its scenes. Presentation
   only — mastery and meters never hear a note. */
const fs=require('fs');
const F='/home/user/Claude-Certified-Architect/index.html';
let h=fs.readFileSync(F,'utf8');
function rep(a,b,tag){
  const i=h.indexOf(a);
  if(i<0)throw new Error('anchor missing: '+tag);
  if(h.indexOf(a,i+1)>=0)throw new Error('anchor not unique: '+tag);
  h=h.slice(0,i)+b+h.slice(i+a.length);
}

/* 1: the payload rides with the other EA data */
rep(`/* enemy stat medians from the original CHARACTER_CHARCLASS.xml, keyed by foe shape`,
fs.readFileSync('/tmp/dal/audio_payload_lit.js','utf8').trim()+`
/* enemy stat medians from the original CHARACTER_CHARCLASS.xml, keyed by foe shape`,'audio payload');

/* 2: Sfx learns the original samples; Music joins it */
rep(`  function play(name){
    if(!S.settings.sound)return;
    if(!ensure())return;
    try{
      if(ctx.state==="suspended")ctx.resume();
      const t=ctx.currentTime+0.01;
      switch(name){
        case "click": tone(420,t,0.06,"triangle",0.25); break;
        case "good": tone(523,t,0.09,"triangle",0.5); tone(784,t+0.07,0.14,"triangle",0.45); break;
        case "great": tone(523,t,0.08,"triangle",0.5); tone(659,t+0.06,0.08,"triangle",0.5); tone(1047,t+0.12,0.2,"triangle",0.45); break;
        case "bad": tone(160,t,0.22,"sawtooth",0.3,80); break;
        case "hit": tone(220,t,0.1,"square",0.22,120); break;
        case "win": [523,659,784,1047].forEach((f,i)=>tone(f,t+i*0.09,0.16,"triangle",0.42)); break;
        case "lose": [330,262,196,147].forEach((f,i)=>tone(f,t+i*0.12,0.2,"sawtooth",0.22)); break;
        case "levelup": [392,523,659,784,1047].forEach((f,i)=>tone(f,t+i*0.07,0.13,"triangle",0.4)); break;
        case "open": tone(300,t,0.12,"triangle",0.35,600); break;
        case "step": tone(90,t,0.03,"square",0.05); break;
      }
    }catch(e){}
  }
  return {play,unlock};
})();`,
`  /* ---- the original samples (DATA.eaSnd), decoded lazily ---- */
  let sMaster=null;
  const bank={},loading={};
  function sEnsure(){
    if(!ensure())return false;
    if(!sMaster){sMaster=ctx.createGain();sMaster.gain.value=0.55;sMaster.connect(ctx.destination)}
    return true;
  }
  function playBuf(b,vol,rate){
    const src=ctx.createBufferSource();src.buffer=b;
    if(rate)src.playbackRate.value=rate;
    const g=ctx.createGain();g.gain.value=(vol!=null?vol:1);
    src.connect(g);g.connect(sMaster);src.start();
  }
  function ea(name,vol,rate){
    if(!S.settings.sound)return true;
    if(!DATA.eaSnd||!DATA.eaSnd[name])return false;
    if(!sEnsure())return false;
    try{
      if(ctx.state==="suspended")ctx.resume();
      if(bank[name]){playBuf(bank[name],vol,rate);return true}
      if(!loading[name]){
        loading[name]=1;
        fetch(DATA.eaSnd[name]).then(r=>r.arrayBuffer()).then(ab=>ctx.decodeAudioData(ab))
          .then(b=>{bank[name]=b;playBuf(b,vol,rate)}).catch(()=>{});
      }
      return true;
    }catch(e){return false}
  }
  /* generic feedback routes to the original cues where one exists */
  const EAMAP={click:"ButtonPress_1",win:"Victory",lose:"Defeated",levelup:"level_up",open:"OpenMenu"};
  let stepN=0;
  function play(name){
    if(!S.settings.sound)return;
    if(name==="step"&&DATA.eaSnd){ea("da_flash_pc_walk"+(1+(stepN++%5))+"_sgl",0.35);return}
    if(EAMAP[name]&&ea(EAMAP[name],0.8))return;
    if(!ensure())return;
    try{
      if(ctx.state==="suspended")ctx.resume();
      const t=ctx.currentTime+0.01;
      switch(name){
        case "click": tone(420,t,0.06,"triangle",0.25); break;
        case "good": tone(523,t,0.09,"triangle",0.5); tone(784,t+0.07,0.14,"triangle",0.45); break;
        case "great": tone(523,t,0.08,"triangle",0.5); tone(659,t+0.06,0.08,"triangle",0.5); tone(1047,t+0.12,0.2,"triangle",0.45); break;
        case "bad": tone(160,t,0.22,"sawtooth",0.3,80); break;
        case "hit": tone(220,t,0.1,"square",0.22,120); break;
        case "win": [523,659,784,1047].forEach((f,i)=>tone(f,t+i*0.09,0.16,"triangle",0.42)); break;
        case "lose": [330,262,196,147].forEach((f,i)=>tone(f,t+i*0.12,0.2,"sawtooth",0.22)); break;
        case "levelup": [392,523,659,784,1047].forEach((f,i)=>tone(f,t+i*0.07,0.13,"triangle",0.4)); break;
        case "open": tone(300,t,0.12,"triangle",0.35,600); break;
        case "step": tone(90,t,0.03,"square",0.05); break;
      }
    }catch(e){}
  }
  return {play,unlock,ea};
})();
/* ---- the original music loops, scored to the screen ---- */
const Music=(()=>{
  let el=null,cur=null;
  function ensure(){if(!el){el=new Audio();el.loop=true;el.preload="auto"}return el}
  function vol(){return (S&&S.settings&&S.settings.music===false)?0:0.45}
  function go(key){
    if(!DATA.eaMusic||!DATA.eaMusic[key]||vol()===0){return}
    const e=ensure();e.volume=vol();
    if(cur===key){if(e.paused)e.play().catch(()=>{});return}
    cur=key;e.src=DATA.eaMusic[key];
    e.play().catch(()=>{});
  }
  function stop(){if(el)el.pause();}
  function sync(){
    if(vol()===0){stop();return}
    const m=(typeof MODE!=="undefined")?MODE:"title";
    if(m==="battle")go("combat");
    else if(m==="keep")go("castle");
    else if(m==="world")go("quest");
    else go("castle");
  }
  return {go,stop,sync,get cur(){return cur}};
})();`,'sfx+music');

/* 3: unlock also wakes the music (autoplay gates open on the first gesture) */
rep(`  function unlock(){try{if(ensure()&&ctx.state==="suspended")ctx.resume()}catch(e){}}`,
`  function unlock(){
    try{if(ensure()&&ctx.state==="suspended")ctx.resume()}catch(e){}
    try{if(typeof Music!=="undefined")Music.sync()}catch(e){}
  }`,'unlock music');

/* 4: the screens keep their scores */
rep(`  MODE="battle";
  P.path=[];P.pending=null;`,
`  MODE="battle";
  Music.sync();
  Sfx.ea("combat_start_B",0.7);
  if(cfg.boss)Sfx.ea("Heartbeat",0.9);
  P.path=[];P.pending=null;`,'battle music');

rep(`function endBattleUI(){
  B=null;MODE="world";`,
`function endBattleUI(){
  B=null;MODE="world";
  Music.sync();`,'endBattle music');

rep(`function openKeep(){
  MODE="keep";`,
`function openKeep(){
  MODE="keep";
  Music.sync();`,'keep music');

rep(`function closeKeep(){
  $("keepScr").classList.add("hidden");
  MODE="world";`,
`function closeKeep(){
  $("keepScr").classList.add("hidden");
  MODE="world";
  Music.sync();`,'closeKeep music');

rep(`  $("keepScr").classList.add("hidden");
  MODE="world";
  refreshHUD();Sfx.play("open");`,
`  $("keepScr").classList.add("hidden");
  MODE="world";
  Music.sync();
  refreshHUD();Sfx.play("open");`,'regionGo music');

rep(`function toTitle(){
  MODE="title";B=null;`,
`function toTitle(){
  MODE="title";B=null;
  Music.sync();`,'title music');

rep(`  $("hud").classList.remove("hidden");
  MODE="world";
  S.session=freshSession();`,
`  $("hud").classList.remove("hidden");
  MODE="world";
  Music.sync();
  S.session=freshSession();`,'newgame music');

/* 5: the original voice barks and foe grunts */
rep(`/* ---- resolution (damage stays in the one funnel: attackDamage) ---- */`,
`/* ---- original voice barks: by champion build; foes grunt by shape ---- */
function heroBark(kind){
  const hc=heroChoice();
  const fem=hc?(hc.rig==="heroRog"||hc.rig==="heroArc"):true;
  const M={atk:["ATK1_00271218_m","ATK2_00271219_m","ATK4_00271222_m"],
           pain:["PAIN2_00271225_m","PAIN3_00271228_m","PAIN4_00271227_m"],
           death:["DEATH3_00271235_m"]};
  const Fe={atk:["ATK2_ss_elf_woman00333681_m","ATK3_ss_elf_woman00333682_m","ATK4_ss_elf_woman00333684_m"],
           pain:["PAIN2_ss_elf_woman00333688_m","PAIN3_ss_elf_woman00333687_m","PAIN5_ss_elf_woman00333690_m"],
           death:["DEATH4_ss_elf_woman00333695_m"]};
  const list=(fem?Fe:M)[kind];if(!list)return;
  Sfx.ea(list[(Math.random()*list.length)|0],0.5);
}
const FOEPAIN={goblin:["genlock_pain_grunt1","genlock_pain_grunt2","genlock_pain_grunt6"],
  ogre:["ogre_pain_grunt2","ogre_pain_grunt3","ogre_pain_grunt9"],
  spider:["spider_pain_1","spider_pain_3","spider_pain_5"],
  ghost:["ss_shriek_pain_1","ss_shriek_pain_5"],banshee:["ss_shriek_pain_6","ss_shriek_taunt_2"]};
const FOEDIE={goblin:"genlock_combat_death4",ogre:"ogre_combat_death1",
  spider:"spider_death_5",ghost:"ss_shriek_death_6",banshee:"ss_shriek_death_6"};
function foePainSnd(f){
  if(!f||!f.e)return;
  if(f.halves<=0&&FOEDIE[f.e.shape]){Sfx.ea(FOEDIE[f.e.shape],0.55);return}
  const l=FOEPAIN[f.e.shape];if(l)Sfx.ea(l[(Math.random()*l.length)|0],0.45);
}
/* ---- resolution (damage stays in the one funnel: attackDamage) ---- */`,'barks');

/* 6: strikes carry their original sounds (class-aware) */
rep(`  if(superEff)addFloater("SUPER EFFECTIVE",0.5,-112,"#9fe0ff",15);
  if(glancing)addFloater("GLANCING — no mastery",0.42,-130,"#c9b890",13);
  Sfx.play("hit");`,
`  if(superEff)addFloater("SUPER EFFECTIVE",0.5,-112,"#9fe0ff",15);
  if(glancing)addFloater("GLANCING — no mastery",0.42,-130,"#c9b890",13);
  Sfx.play("hit");
  const atkM=B.party[sel.member];
  if(atkM&&atkM.kind==="hero"&&Math.random()<0.6)heroBark("atk");
  const acls=atkM&&atkM.cls;
  if(acls==="ranger"){Sfx.ea("cbt_longbow_fire1",0.65);Sfx.ea("arrow_thunk",0.75)}
  else if(acls==="caster")Sfx.ea(crit?"ArcaneBolt":"Bolt",0.65);
  else Sfx.ea(crit?"MAIMSwordOrBayonetPE10_24":"Slash",0.75);
  if(crit)Sfx.ea("Xplode",0.45);
  foePainSnd(B.foes[B.target]);`,'strike sounds');

rep(`  setSeq({t0:nowSec(),dur:0.95,kind:"fizzle",mi:sel.member,fi:B.target});
  addFloater(fumble?"FUMBLE":"MISS",0.6,-84,"#b9bcc4",15);
  Sfx.play("bad");`,
`  setSeq({t0:nowSec(),dur:0.95,kind:"fizzle",mi:sel.member,fi:B.target});
  addFloater(fumble?"FUMBLE":"MISS",0.6,-84,"#b9bcc4",15);
  Sfx.play("bad");
  const mcls=B.party[sel.member]&&B.party[sel.member].cls;
  Sfx.ea(mcls==="ranger"?"arrow_whistle_miss":"glo_fly_wep_weapon_impacts_axe_movement_swish_000",0.6);`,'miss sounds');

rep(`  addFloater(m.cls==="vanguard"?"BLOCKED":"DODGED",0.3,-92,"#9fe0b0",16);`,
`  addFloater(m.cls==="vanguard"?"BLOCKED":"DODGED",0.3,-92,"#9fe0b0",16);
  Sfx.ea(m.cls==="vanguard"?"spark_impact":"evade",0.6);`,'guard sounds');

rep(`  if(victim.halves<=0)addFloater(victim.kind==="hero"?"THE ARCHITECT FALLS":"DOWN",0.3,-100,"#e0705f",13);
  Sfx.play("bad");
}`,
`  if(victim.halves<=0)addFloater(victim.kind==="hero"?"THE ARCHITECT FALLS":"DOWN",0.3,-100,"#e0705f",13);
  Sfx.play("bad");
  Sfx.ea("impact23",0.7);
  if(victim.kind==="hero")heroBark(victim.halves<=0?"death":"pain");
}`,'pain sounds');

rep(`  B.fx.shake=S.settings.motion?9:0;
  addFloater("SWEEP -"+fmtH(B.aoe.dmg)+(hit.length>1?" ×"+hit.length:""),0.3,-78,"#e0705f",16);
  B.aoe=null;
  Sfx.play("bad");`,
`  B.fx.shake=S.settings.motion?9:0;
  addFloater("SWEEP -"+fmtH(B.aoe.dmg)+(hit.length>1?" ×"+hit.length:""),0.3,-78,"#e0705f",16);
  B.aoe=null;
  Sfx.play("bad");
  Sfx.ea("fxe_shockwave_p",0.7);
  if(hit.some(m=>m.kind==="hero"))heroBark("pain");`,'sweep sounds');

rep(`  addFloater("SWEEP TURNED",0.3,-96,"#9fe0b0",16);
  B.aoe=null;
  Sfx.play("good");`,
`  addFloater("SWEEP TURNED",0.3,-96,"#9fe0b0",16);
  B.aoe=null;
  Sfx.play("good");
  Sfx.ea("spark_impact",0.6);`,'sweep turn sound');

/* 7: the die speaks on its corners */
rep(`  if(R.for==="attack"){
    const crit=n>1&&n>=t.critOn;`,
`  if(n===20)Sfx.ea("DA_Sting_02",0.6);else if(n===1)Sfx.ea("Oops",0.7);
  if(R.for==="attack"){
    const crit=n>1&&n>=t.critOn;`,'die sounds');

/* 8: the loot chest and the party screen */
rep(`  if(wDrop)html+="<div class='rewardline'><span class='ric'>⚔</span><span>Weapon won: <b>"+esc(wDrop.n)+"</b>`,
`  if(wDrop)Sfx.ea("LootGet",0.8);
  if(wDrop)html+="<div class='rewardline'><span class='ric'>⚔</span><span>Weapon won: <b>"+esc(wDrop.n)+"</b>`,'loot sound');

rep(`function chooseHero(after,isNew){
  let html="<h2 class='serif'>"+(isNew?"Choose your champion":"The Hero Room")+"</h2>"+`,
`function chooseHero(after,isNew){
  Music.go("party");
  let html="<h2 class='serif'>"+(isNew?"Choose your champion":"The Hero Room")+"</h2>"+`,'party music');

rep(`  showModal(html,[{label:isNew?"Decide later — ride with Deymour":"Keep as is",cls:"ghost",fn:()=>{if(after)after()}}]);`,
`  showModal(html,[{label:isNew?"Decide later — ride with Deymour":"Keep as is",cls:"ghost",fn:()=>{Music.sync();if(after)after()}}]);`,'party music back1');

rep(`      S.hero={rig:c.rig,cls:c.cls};
      closeModal();Sfx.play("levelup");`,
`      S.hero={rig:c.rig,cls:c.cls};
      closeModal();Music.sync();Sfx.play("levelup");Sfx.ea("da_flash_equip1_sgl",0.8);`,'party music back2');

/* 9: settings row + default */
rep(`  return row("sound","Sound","Synthesized chimes and strikes")+`,
`  return row("music","Music","The original loops — castle, quest, battle")+
         row("sound","Sound","The original strikes, spells and voices")+`,'settings row');

rep(`    settings:{sound:true,motion:true,dpad:false},`,
`    settings:{sound:true,music:true,motion:true,dpad:false},`,'settings default');

rep(`function applySettings(){
  document.body.classList.toggle("nomotion",!S.settings.motion);`,
`function applySettings(){
  document.body.classList.toggle("nomotion",!S.settings.motion);
  if(S.settings.music===false)Music.stop();else Music.sync();`,'applySettings music');

/* 10: bridge */
rep(`  applyCardPos, applyCardMin, chooseHero, heroRigKey, heroChoice,`,
`  applyCardPos, applyCardMin, get Music(){return Music}, heroBark, chooseHero, heroRigKey, heroChoice,`,'bridge');

fs.writeFileSync(F,h);
const blocks=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
let bad=0;blocks.forEach((s,i)=>{try{new Function(s)}catch(e){console.log('SYNTAX ERR block',i,e.message);bad++}});
console.log(bad?'FAILED':'ok -',(h.length/1048576).toFixed(1)+'MB,',blocks.length,'blocks');
