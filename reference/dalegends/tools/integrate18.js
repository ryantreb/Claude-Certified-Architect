/* Pass 18: fight the original fights.
   - Region bosses become the campaign's named villains: Raspin, Soleil,
     Tianne, Deymour, Beirus (rigs verbatim; Raspin newly composed from
     HumanoidMob_1H + the bandit leader's armor).
   - Road battles spawn the ORIGINAL node compositions: DATA.eaEnc carries
     every walked page's chain-ordered waves (shapes + original names) and
     each fight's original BGTileset; all 18 original backdrops now ship.
   - Guild companions get their own composed sprites (Standard armors +
     their own preset heads) — the villain placeholders are freed.
   - The champion visibly re-dresses: worn armor of weightClass >= 2 swaps
     the hero rig to its Standard outfit.
   All tactical/presentation — mastery and meters unmoved. */
const fs=require('fs');
const F='/home/user/Claude-Certified-Architect/index.html';
let h=fs.readFileSync(F,'utf8');
function rep(a,b,tag){
  const i=h.indexOf(a);
  if(i<0)throw new Error('anchor missing: '+tag);
  if(h.indexOf(a,i+1)>=0)throw new Error('anchor not unique: '+tag);
  h=h.slice(0,i)+b+h.slice(i+a.length);
}

/* 1: payloads — new rigs ride with the hero payload; enc data with eaStats */
rep(`/* enemy stat medians from the original CHARACTER_CHARCLASS.xml, keyed by foe shape`,
fs.readFileSync('/tmp/dal/more_payload.js','utf8').trim()+`
/* enemy stat medians from the original CHARACTER_CHARCLASS.xml, keyed by foe shape`,'rigs payload');

/* eaEnc + eaStats additions go AFTER the eaStats literal (they extend it) */
{
  const tag='DATA.eaWeapons=';
  const at=h.indexOf(tag);
  if(at<0)throw new Error('eaWeapons anchor missing');
  h=h.slice(0,at)+fs.readFileSync('/tmp/dal/enc_lit.js','utf8').trim()+'\n'+h.slice(at);
}

/* full original backdrop set replaces the City-only payload */
{
  const start=h.indexOf('DATA.eaBg={');
  if(start<0)throw new Error('eaBg payload missing');
  const end=h.indexOf('\n',start)+1;
  h=h.slice(0,start)+fs.readFileSync('/tmp/dal/bglayers/eabg_payload.js','utf8').trim()+'\n'+h.slice(end);
}

/* refreshed quest maps (adds Kirkwall for the Forge's sixth region) */
{
  const start=h.indexOf('DATA.eaMap={"PP"');
  if(start<0)throw new Error('eaMap payload missing');
  const end=h.indexOf('\n',start)+1;
  h=h.slice(0,start)+fs.readFileSync('/tmp/dal/eamap2_payload.js','utf8').trim()+'\n'+h.slice(end);
}

/* 2: tilesets resolve as battle environments */
rep(`const ENVBG={meadow:"Grassland",forest:"Forest",desert:"Wasteland",volcano:"larvaCaves",
  ruins:"RuinCaves",crystal:"murkycaves",sky:"Mountain"};`,
`const ENVBG={meadow:"Grassland",forest:"Forest",desert:"Wasteland",volcano:"larvaCaves",
  ruins:"RuinCaves",crystal:"murkycaves",sky:"Mountain",
  /* the original waveset tilesets, straight through */
  grassland:"Grassland",grasslandRoad:"GrasslandRoad",forestRoad:"ForestRoad",
  mountain:"Mountain",swamp:"Swamp",wasteland:"Wasteland",coast:"Coast",
  snowy:"Snowy",ruinCaves:"RuinCaves",murkyCaves:"murkycaves",larvaCaves:"larvaCaves",city:"City"};`,'envbg');

/* 3: new shapes ride existing + new rigs */
rep(`const SHAPE_SPRITE={goblin:"genlock",ghost:"shadeDemon",golem:"golem",zombie:"corpse",
  spider:"spiders",ogre:"ogre",skeleton:"skeleton",wisp:"rageDemon",banshee:"desire",
  slime:"deepstalker",minotaur:"bronto",dragon:"dragon",portal:"arcaneHorror",skelpair:"skeleton"};
/* the party are the game's own companions — complete baked rigs, original palettes */
const CLASS_SPRITE={vanguard:"shale",shadow:"tianne",caster:"soleil",ranger:"beirus"};`,
`const SHAPE_SPRITE={goblin:"genlock",ghost:"shadeDemon",golem:"golem",zombie:"corpse",
  spider:"spiders",ogre:"ogre",skeleton:"skeleton",wisp:"rageDemon",banshee:"desire",
  slime:"deepstalker",minotaur:"bronto",dragon:"dragon",portal:"arcaneHorror",skelpair:"skeleton",
  /* the original encounter cast */
  stalker:"deepstalker",mabari:"mabari",bear:"bear",sylvan:"sylvan",werewolf:"werewolf",
  shriek:"shriek",hurlock1H:"hurlock1H",hurlock2H:"hurlock2H",hurlockStaff:"hurlockStaff",
  bandit1H:"bandit1H",banditMage:"banditMage",banditBow:"banditBow",carta:"carta2H",
  /* the campaign's named villains */
  raspin:"raspin",tianne:"tianne",soleil:"soleil",beirus:"beirus",deymour:"deymour"};
/* the party companions wear their own guild looks (Standard armors, preset heads) */
const CLASS_SPRITE={vanguard:"compVan",shadow:"compSha",caster:"compCas",ranger:"compRng"};`,'shapes');

rep(`const SHMELEE={skeleton:1,skelpair:1,zombie:1,spider:1,ogre:1,minotaur:1,golem:1,slime:1,goblin:1,dragon:0,ghost:0,banshee:0,wisp:0,portal:0};`,
`const SHMELEE={skeleton:1,skelpair:1,zombie:1,spider:1,ogre:1,minotaur:1,golem:1,slime:1,goblin:1,dragon:0,ghost:0,banshee:0,wisp:0,portal:0,
  stalker:1,mabari:1,bear:1,sylvan:1,werewolf:1,shriek:1,hurlock1H:1,hurlock2H:1,carta:1,bandit1H:1,raspin:1,tianne:1,
  hurlockStaff:0,banditMage:0,banditBow:0,soleil:0,beirus:0,deymour:0};`,'melee map');

/* 4: the villains take the rifts (same boss ids, original faces) */
rep(`function startBattle(cfg){`,
`/* the campaign's named villains take the region rifts, by act:
   Raspin, Soleil, Tianne, Deymour, Beirus (stats from their CHARCLASS rows) */
const EAVILLAIN=[
  {shape:"raspin",name:"Raspin",taunt:"The Pass is mine — and the toll is everything you carry."},
  {shape:"soleil",name:"Soleil",taunt:"My demons were only the invitation."},
  {shape:"tianne",name:"Tianne",taunt:"The vineyard runs red tonight."},
  {shape:"deymour",name:"Deymour",taunt:"There is no ship out of Jainen."},
  {shape:"beirus",name:"Beirus",taunt:"The Deep Roads keep what they take."}];
(function(){
  for(const tr of ["c","g"]){
    DATA.regions.filter(r=>r.cert===tr).forEach((r,i)=>{
      const v=EAVILLAIN[i];if(!v||!r.boss||!DATA.enemies[r.boss])return;
      const e=DATA.enemies[r.boss];
      e.name=v.name;e.shape=v.shape;e.taunt=v.taunt;
      e.lore=(e.lore?e.lore+" ":"")+"The campaign's own terror, wearing its original face.";
    });
  }
})();
function startBattle(cfg){`,'villains');

/* 5: original node compositions spawn the fight */
rep(`function buildFoes(cfg,d){
  let list;
  if(cfg.gauntlet)list=[mkFoe(cfg.enemyKey,cfg.gauntlet.total*2,true)];
  else if(cfg.boss){
    list=[mkFoe(cfg.enemyKey,10+(d.tier==="strong"?2:0))];
    if(d.tier!=="weak"&&cfg.region)list.push(mkFoe(pick(cfg.region.enemies),4));
  }else{
    const n=d.tier==="weak"?1:(d.tier==="strong"?(Math.random()<0.5?3:2):(Math.random()<0.4?2:1));
    list=[mkFoe(cfg.enemyKey,4)];
    for(let i=1;i<n;i++)list.push(mkFoe(pick(cfg.region.enemies),4));
  }
  placeFoes(list);
  return list;
}`,
`/* a foe straight from an original wave row: shape + original name */
function mkFoeEa(row,halves){
  const e={name:row.n,shape:row.s,taunt:"",size:1,hue:0};
  const hv=Math.max(2,Math.min(halves+6,Math.round(halves*eaHpW(e.shape))));
  return {key:"ea:"+row.s,e,halves:hv,max:hv,atkW:eaAtkW(e.shape),hitT:-9,dieT:-9,stun:0,seed:Math.random()*9,cell:{col:0,row:0}};
}
function buildFoes(cfg,d){
  let list;
  if(cfg.gauntlet)list=[mkFoe(cfg.enemyKey,cfg.gauntlet.total*2,true)];
  else if(cfg.boss){
    list=[mkFoe(cfg.enemyKey,10+(d.tier==="strong"?2:0))];
    if(d.tier!=="weak"&&cfg.region)list.push(mkFoe(pick(cfg.region.enemies),4));
  }else if(cfg.eaWave&&cfg.eaWave.length){
    /* the original composition of this very node */
    list=cfg.eaWave.slice(0,6).map(row=>mkFoeEa(row,4));
  }else{
    const n=d.tier==="weak"?1:(d.tier==="strong"?(Math.random()<0.5?3:2):(Math.random()<0.4?2:1));
    list=[mkFoe(cfg.enemyKey,4)];
    for(let i=1;i<n;i++)list.push(mkFoe(pick(cfg.region.enemies),4));
  }
  placeFoes(list);
  return list;
}
/* the original encounter at a road node, from its page anchor (read-only) */
function nodeEnc(n){
  if(!n||!n.mp||!DATA.eaEnc)return null;
  const pages=DATA.eaEnc[n.mp.key];
  const page=pages&&pages[n.mp.page];
  return (page&&page[n.mp.pi])||null;
}`,'wave spawn');

/* 6: spawn sites pass the wave + tileset through */
rep(`  startBattle({enemyKey:sp.enemy,region:sp.region,spawn:sp,boss:false});`,
`  const nd=sp.node?nodeEnc(sp.node):null;
  startBattle({enemyKey:sp.enemy,region:sp.region,spawn:sp,boss:false,
    eaWave:nd&&nd.foes,eaBgTile:nd&&nd.bg});`,'spawn wave');

rep(`      [{label:"Patrol",cls:"primary",fn:()=>startBattle({enemyKey:n.enemy,region:n.region,spawn:null,boss:false})},`,
`      [{label:"Patrol",cls:"primary",fn:()=>{const nd=nodeEnc(n);
        startBattle({enemyKey:n.enemy,region:n.region,spawn:null,boss:false,
          eaWave:nd&&nd.foes,eaBgTile:nd&&nd.bg})}},`,'patrol wave');

rep(`    enemyKey:cfg.enemyKey,enemy:DATA.enemies[cfg.enemyKey],region:cfg.region,spawn:cfg.spawn,boss:cfg.boss,`,
`    enemyKey:cfg.enemyKey,enemy:DATA.enemies[cfg.enemyKey],region:cfg.region,spawn:cfg.spawn,boss:cfg.boss,
    eaBgTile:cfg.eaBgTile||null,`,'B tile');

/* 7: the fight stands on its original ground */
rep(`  const env=B.region?(DATA.regionEnv[B.region.id]||"meadow"):"sky";`,
`  const env=(B.eaBgTile&&ENVBG[B.eaBgTile])?B.eaBgTile:(B.region?(DATA.regionEnv[B.region.id]||"meadow"):"sky");`,'battle env');

/* 8: the champion visibly re-dresses at Standard-grade armor */
rep(`function heroRigKey(){return (S.hero&&rigReady(S.hero.rig))||rigReady(HERO_SPRITE)}`,
`function heroRigKey(){
  const base=S.hero&&S.hero.rig;
  if(base&&S.gear&&S.gear.armor!=null&&DATA.eaItems){
    const it=(DATA.eaItems.armor||[])[S.gear.armor];
    if(it&&it[7]>=2){const k=rigReady(base+"Std");if(k)return k}
  }
  return (base&&rigReady(base))||rigReady(HERO_SPRITE);
}`,'visible armor');

/* 9: the new cast grunts in its original voice */
rep(`const FOEPAIN={goblin:["genlock_pain_grunt1","genlock_pain_grunt2","genlock_pain_grunt6"],
  ogre:["ogre_pain_grunt2","ogre_pain_grunt3","ogre_pain_grunt9"],
  spider:["spider_pain_1","spider_pain_3","spider_pain_5"],
  ghost:["ss_shriek_pain_1","ss_shriek_pain_5"],banshee:["ss_shriek_pain_6","ss_shriek_taunt_2"]};`,
`const FOEPAIN={goblin:["genlock_pain_grunt1","genlock_pain_grunt2","genlock_pain_grunt6"],
  ogre:["ogre_pain_grunt2","ogre_pain_grunt3","ogre_pain_grunt9"],
  spider:["spider_pain_1","spider_pain_3","spider_pain_5"],
  ghost:["ss_shriek_pain_1","ss_shriek_pain_5"],banshee:["ss_shriek_pain_6","ss_shriek_taunt_2"],
  stalker:["deepstalker_pain_1","deepstalker_pain_5"],shriek:["ss_shriek_pain_1","ss_shriek_pain_6"],
  hurlock1H:["ss_hurlock8","ss_hurlock10"],hurlock2H:["ss_hurlock15","ss_hurlock17"],
  hurlockStaff:["ss_hurlock22","ss_hurlock29"]};`,'pains');

rep(`const FOEDIE={goblin:"genlock_combat_death4",ogre:"ogre_combat_death1",
  spider:"spider_death_5",ghost:"ss_shriek_death_6",banshee:"ss_shriek_death_6"};`,
`const FOEDIE={goblin:"genlock_combat_death4",ogre:"ogre_combat_death1",
  spider:"spider_death_5",ghost:"ss_shriek_death_6",banshee:"ss_shriek_death_6",
  stalker:"deepstalker_death_1",shriek:"ss_shriek_death_6",
  hurlock1H:"ss_hurlock33",hurlock2H:"ss_hurlock33"};`,'deaths');

/* 10: the sixth Forge region rides Kirkwall */
rep(`const MAPBIND={c:["R_T","R_PP","R_PF","R_GD","R_WS"],g:["R_T","R_PP","R_PF","R_GD","R_WS"]};`,
`const MAPBIND={c:["R_T","R_PP","R_PF","R_GD","R_WS"],g:["R_T","R_PP","R_PF","R_GD","R_WS","R_KW"]};`,'mapbind kw');

rep(`const QUESTBIND=["PP","PF","GD","WS","OR"];`,
`const QUESTBIND=["PP","PF","GD","WS","OR","KW"];`,'questbind kw');

/* 11: bridge */
rep(`  regionRoadPage, worldLoop, layoutRoads, heroMP,`,
`  regionRoadPage, worldLoop, layoutRoads, heroMP, nodeEnc, mkFoeEa,
  get EAVILLAIN(){return EAVILLAIN},`,'bridge');

fs.writeFileSync(F,h);
const blocks=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
let bad=0;blocks.forEach((s,i)=>{try{new Function(s)}catch(e){console.log('SYNTAX ERR block',i,e.message);bad++}});
console.log(bad?'FAILED':'ok -',(h.length/1048576).toFixed(1)+'MB,',blocks.length,'blocks');
