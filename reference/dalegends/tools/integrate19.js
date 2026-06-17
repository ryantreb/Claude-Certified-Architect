/* Pass 19: the small original wins.
   - Villain ProTip portraits face you at the rifts.
   - The original CHARACTER_LEVELING curve replaces the flat one, fed by the
     original per-foe XPForDefeat (CHARCLASS xp medians already in eaStats).
   - Famous companions fight as themselves: Tovez as a Carta dwarf, Shale,
     Barkspawn the mabari, the Fire Drake.
   - The mage's original Summon Spider: a deep-recall special that seats a
     spider ally — it soaks blows and flanks (+1 to hit) while it stands.
   Tactical/presentation only; mastery and meters unmoved. */
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
fs.readFileSync('/tmp/dal/vport_lit.js','utf8').trim()+`
/* the original leveling curve (CHARACTER_LEVELING.xml XPDeltaNext) */
DATA.eaLevels=`+JSON.stringify(JSON.parse(fs.readFileSync('/tmp/dal/levels.json','utf8')))+`;
/* enemy stat medians from the original CHARACTER_CHARCLASS.xml, keyed by foe shape`,'payloads');

/* 2: the original curve and per-foe experience */
rep(`function xpNeed(lv){return 60+(lv-1)*45}`,
`/* the original ledger: XPDeltaNext per level, clamped at the table's end */
function xpNeed(lv){
  const t=DATA.eaLevels;
  return (t&&t.length)?(t[Math.min(lv-1,t.length-1)]):60+(lv-1)*45;
}
/* a battle pays what its foes were worth (XPForDefeat medians) */
function battleXp(wasBoss){
  let n=0;
  if(B&&B.foes)for(const f of B.foes)n+=((DATA.eaStats[f.e.shape]||{}).xp||6);
  if(wasBoss)n*=3;
  return Math.max(10,Math.round(n*2.2));
}`,'curve');

rep(`  const ups=addXP(wasBoss?45:15);`,
`  const xpGain=battleXp(wasBoss);
  const ups=addXP(xpGain);`,'xp gain');

rep(`  html+="<div class='rewardline'><span class='ric'>✦</span><span>+"+shards+" aether shards · +"+(wasBoss?45:15)+" xp"+(ups?" · LEVEL UP!":"")+"</span></div>";`,
`  html+="<div class='rewardline'><span class='ric'>✦</span><span>+"+shards+" aether shards · +"+xpGain+" xp"+(ups?" · LEVEL UP!":"")+"</span></div>";`,'xp line');

/* 3: famous companions fight as themselves */
rep(`function memberSpriteKey(m){return m&&m.kind==="hero"?heroRigKey():rigReady(CLASS_SPRITE[m&&m.cls])}`,
`const EACOMP_SPRITE={NPC_TOVEZ:"carta2H",NPC_SHALE:"shale",NPC_BARKSPAWN:"mabari",NPC_DRAKE:"dragon"};
function memberSpriteKey(m){
  if(m&&m.kind==="hero")return heroRigKey();
  if(m&&m.kind==="summon")return rigReady(m.sprite)||rigReady("spiders");
  if(m&&m.kind==="comp"&&EACOMP_SPRITE[m.id]){const k=rigReady(EACOMP_SPRITE[m.id]);if(k)return k}
  return rigReady(CLASS_SPRITE[m&&m.cls]);
}`,'comp sprites');

/* 4: the rift speaks with its villain's face */
rep(`  const e=DATA.enemies[rift.region.boss];
  const ph=st.phase+1,tot=bossPhasesTotal(rift.region);
  showModal("<h2 class='serif'>"+esc(e.name)+"</h2><p class='dim small'>"+esc(e.lore)+"</p>"+`,
`  const e=DATA.enemies[rift.region.boss];
  const ph=st.phase+1,tot=bossPhasesTotal(rift.region);
  const vport=(DATA.eaVillainPort&&DATA.eaVillainPort[e.shape])?
    "<img src='"+DATA.eaVillainPort[e.shape]+"' alt='' style='float:right;width:96px;margin:0 0 8px 10px;border-radius:10px;border:1px solid #5a4a72;background:#241d33'>":"";
  showModal(vport+"<h2 class='serif'>"+esc(e.name)+"</h2><p class='dim small'>"+esc(e.lore)+"</p>"+`,'villain port');

/* 5: the mage's original summon */
rep(`  caster:[
    {n:"Bolt",lv:1,mana:0,dmg:2,anim:"bolt",d:"a magical attack that reaches any line"},
    {n:"Frostbite",lv:5,mana:1,dmg:1,stun:1,anim:"frost",d:"cripples the target in ice — it loses its next turn"},
    {n:"Storm",lv:10,mana:2,dmg:1,all:true,anim:"chain",d:"lightning hits all enemies"}],`,
`  caster:[
    {n:"Bolt",lv:1,mana:0,dmg:2,anim:"bolt",d:"a magical attack that reaches any line"},
    {n:"Frostbite",lv:5,mana:1,dmg:1,stun:1,anim:"frost",d:"cripples the target in ice — it loses its next turn"},
    {n:"Storm",lv:10,mana:2,dmg:1,all:true,anim:"chain",d:"lightning hits all enemies"},
    {n:"Summon Spider",lv:15,mana:1,dmg:0,summon:"spiders",anim:"bolt",d:"summons an allied spider — it soaks blows and flanks while it stands"}],`,'summon skill');

rep(`function chooseStrike(idx){`,
`/* the original Summon Spider: the deep recall earned the act; the ally
   simply arrives (no die). Tactical only — it soaks and flanks. */
function castSummon(sk){
  if(B.party.some(m=>m.kind==="summon"&&m.halves>0)){toast("The spider already prowls.");return false}
  B.mana-=sk.mana||0;
  const taken=new Set(B.party.filter(m=>m.halves>0).map(m=>m.cell.col+":"+m.cell.row));
  let cell={col:1,row:1};
  outer:for(const col of [1,0])for(const row of [1,0,2])
    if(!taken.has(col+":"+row)){cell={col,row};break outer}
  const sm={kind:"summon",id:"summon_spider",name:"Summoned Spider",cls:"shadow",sprite:"spiders",
    hitT:-9,cell,max:4,halves:4};
  B.party.push(sm);
  addFloater("THE SPIDER ANSWERS",0.4,-96,"#9fe0b0",14);
  Sfx.ea("vfx_spells_vfx_new_spirit_fxa_sum_conj_aoe_c_imp_n_000",0.7);
  {const mi=B.party.indexOf(sm);const at=fxAtMember(mi);if(at)spawnFx("buff",at.x,at.y,{scale:0.8})}
  B.phase="fb";revealContinue();updateBattleHUD();queueSave();
  return true;
}
/* a living summon flanks: +1 to the whole party's strikes */
function summonHitBonus(){return (B&&B.party&&B.party.some(m=>m.kind==="summon"&&m.halves>0))?1:0}
function chooseStrike(idx){`,'summon');

rep(`function atkBonusOf(m){
  const r=eaCompRec(m);
  return 4+wieldHitBonus(m)+gearHitBonus(m)+(r?Math.round(r.atk/12):0);
}`,
`function atkBonusOf(m){
  const r=eaCompRec(m);
  return 4+wieldHitBonus(m)+gearHitBonus(m)+(r?Math.round(r.atk/12):0)
    +(typeof summonHitBonus==="function"?summonHitBonus():0);
}`,'summon flank');

fs.writeFileSync(F,h);
const blocks=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
let bad=0;blocks.forEach((s,i)=>{try{new Function(s)}catch(e){console.log('SYNTAX ERR block',i,e.message);bad++}});
console.log(bad?'FAILED':'ok -',(h.length/1048576).toFixed(1)+'MB,',blocks.length,'blocks');
