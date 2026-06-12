/* Pass 15: the original equipment catalog — stats only.
   DATA.eaItems carries every real EQUIPMENT_{ARMOR,HELMET,SHIELD,RING,
   AMULET,BELT} row verbatim. Pieces fall from victories into the Vault;
   the champion wears one per slot. Worn stats derive tactical numbers
   only (def→guard cap +3, atk→hit cap +2, agi→crit +1, health→halves,
   power→mana) — mastery and meters never wear a ring. */
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
fs.readFileSync('/tmp/dal/items_lit.js','utf8').trim()+`
/* enemy stat medians from the original CHARACTER_CHARCLASS.xml, keyed by foe shape`,'items payload');

/* 2: state slots */
rep(`    armory:{vanguard:[],shadow:[],caster:[],ranger:[]},
    wield:{vanguard:null,shadow:null,caster:null,ranger:null},`,
`    armory:{vanguard:[],shadow:[],caster:[],ranger:[]},
    wield:{vanguard:null,shadow:null,caster:null,ranger:null},
    vault:{armor:[],helmet:[],shield:[],ring:[],amulet:[],belt:[]},
    gear:{armor:null,helmet:null,shield:null,ring:null,amulet:null,belt:null},`,'vault state');

/* 3: gear math (champion only, capped, documented) */
rep(`/* an original companion's CHARACTER_GUILDNPCS stats ride the die: tactical only */`,
`/* ---- the Vault: original equipment on the champion, tactical only ---- */
const GEAR_SLOTS=["armor","helmet","shield","ring","amulet","belt"];
function vaultState(){
  if(!S.vault)S.vault={armor:[],helmet:[],shield:[],ring:[],amulet:[],belt:[]};
  if(!S.gear)S.gear={armor:null,helmet:null,shield:null,ring:null,amulet:null,belt:null};
}
function wornItems(){
  vaultState();
  if(!DATA.eaItems)return [];
  return GEAR_SLOTS.map(s=>S.gear[s]!=null?(DATA.eaItems[s]||[])[S.gear[s]]:null).filter(Boolean);
}
function gearSum(idx){return wornItems().reduce((n,it)=>n+(it[idx]||0),0)}
/* worn-def→guard (cap +3), worn-atk→hit (cap +2), agi≥12→crit edge,
   health→bonus halves, power≥4→bonus mana — caps keep the die honest */
function gearGuardBonus(m){return (m&&m.kind==="hero")?Math.min(3,Math.round(gearSum(1)/8)):0}
function gearHitBonus(m){return (m&&m.kind==="hero")?Math.min(2,Math.round(gearSum(2)/6)):0}
function gearCritBonus(m){return (m&&m.kind==="hero"&&gearSum(3)>=12)?1:0}
function gearHpBonus(){return Math.min(4,Math.round(gearSum(5)/4))}
function gearManaBonus(){return gearSum(6)>=4?1:0}
function rollItemDrop(boss){
  vaultState();
  if(!DATA.eaItems||!B)return null;
  if(!boss&&Math.random()>0.4)return null;
  const slot=shuffle(GEAR_SLOTS.slice())[0];
  const capW=Math.min(3,Math.max(1,(B.region&&B.region.tier)||1)+(boss?1:0));
  const owned=new Set(S.vault[slot]);
  const cand=(DATA.eaItems[slot]||[]).map((it,i)=>({it,i}))
    .filter(x=>x.it[7]<=capW&&x.it[7]>=Math.max(1,capW-1)&&!owned.has(x.i));
  if(!cand.length)return null;
  const px=cand[(Math.random()*cand.length)|0];
  S.vault[slot].push(px.i);
  if(S.gear[slot]==null)S.gear[slot]=px.i;        /* first find is worn at once */
  return {slot,i:px.i,n:px.it[0],w:px.it[7]};
}
/* an original companion's CHARACTER_GUILDNPCS stats ride the die: tactical only */`,'gear math');

/* 4: the die wears the gear */
rep(`function atkBonusOf(m){
  const r=eaCompRec(m);
  return 4+wieldHitBonus(m)+(r?Math.round(r.atk/12):0);
}`,
`function atkBonusOf(m){
  const r=eaCompRec(m);
  return 4+wieldHitBonus(m)+gearHitBonus(m)+(r?Math.round(r.atk/12):0);
}`,'hit gear');

rep(`function guardBonusOf(m){
  const r=eaCompRec(m);
  return 3+(m&&m.cls==="vanguard"?2:0)+wieldGuardBonus(m)+(r?Math.round(r.df/12):0);
}`,
`function guardBonusOf(m){
  const r=eaCompRec(m);
  return 3+(m&&m.cls==="vanguard"?2:0)+wieldGuardBonus(m)+gearGuardBonus(m)+(r?Math.round(r.df/12):0);
}`,'guard gear');

rep(`function critRangeOf(m,sk){
  const r=eaCompRec(m);
  return Math.max(16,20-(sk&&sk.crit?4:0)-wieldCritBonus(m)-(r&&r.agi>=16?1:0));
}`,
`function critRangeOf(m,sk){
  const r=eaCompRec(m);
  return Math.max(16,20-(sk&&sk.crit?4:0)-wieldCritBonus(m)-gearCritBonus(m)-(r&&r.agi>=16?1:0));
}`,'crit gear');

/* 5: worn health and power ride into the party build */
rep(`  arr.forEach(m=>{m.max=memberHalves(m.cls);m.halves=m.max});
  return arr;
}`,
`  arr.forEach(m=>{m.max=memberHalves(m.cls)+(m.kind==="hero"?gearHpBonus():0);m.halves=m.max});
  return arr;
}`,'hero hp gear');

rep(`    mana:2+S.keepLvl,manaMax:2+S.keepLvl,`,
`    mana:2+S.keepLvl+gearManaBonus(),manaMax:2+S.keepLvl+gearManaBonus(),`,'mana gear');

/* 6: items fall beside weapons */
rep(`  const wDrop=(!B.gauntlet)?rollWeaponDrop(wasBoss):null;`,
`  const wDrop=(!B.gauntlet)?rollWeaponDrop(wasBoss):null;
  const iDrop=(!B.gauntlet&&(wasBoss||!wDrop))?rollItemDrop(wasBoss):null;
  if(iDrop){Sfx.ea("LootPop",0.8);
    html+="<div class='rewardline'><span class='ric'>🛡</span><span>Found: <b>"+esc(iDrop.n)+"</b> — "+iDrop.slot+(S.gear[iDrop.slot]===iDrop.i?" (worn)":"")+". The Vault keeps it.</span></div>";}`,'item drop');

/* 7: the Vault card at the Bastion */
rep(`  html+="<div class='kcard'><h3>The Armory</h3>"+(anyW?ahtml:"<div class='small dim'>Weapons fall from victories — the original arms of the realm. They sharpen the d20 only; mastery never rides a blade.</div>")+"</div>";`,
`  html+="<div class='kcard'><h3>The Armory</h3>"+(anyW?ahtml:"<div class='small dim'>Weapons fall from victories — the original arms of the realm. They sharpen the d20 only; mastery never rides a blade.</div>")+"</div>";
  vaultState();
  let vhtml="",anyV=false;
  for(const slot of GEAR_SLOTS){
    const owned=S.vault[slot]||[];
    if(!owned.length)continue;
    anyV=true;
    vhtml+="<div class='statline' style='margin-top:6px'><span style='text-transform:capitalize'>"+slot+"</span><span class='small dim'>"+(S.gear[slot]==null?"bare":"")+"</span></div><div>";
    owned.forEach(ii=>{
      const it=DATA.eaItems[slot][ii];if(!it)return;
      const on=S.gear[slot]===ii;
      const tag=[it[1]?("+"+it[1]+" def"):"",it[2]?((it[2]>0?"+":"")+it[2]+" atk"):"",it[3]?("+"+it[3]+" agi"):"",it[5]?("+"+it[5]+" hp"):"",it[6]?("+"+it[6]+" pw"):""].filter(Boolean).join(" · ");
      vhtml+="<button class='btn sm "+(on?"primary":"ghost")+"' data-act='wear' data-slot='"+slot+"' data-i='"+ii+"' style='margin:2px 4px 2px 0'>"+esc(it[0])+(tag?" · "+tag:"")+(on?" · worn":"")+"</button>";
    });
    vhtml+="</div>";
  }
  html+="<div class='kcard'><h3>The Vault</h3>"+(anyV?vhtml:"<div class='small dim'>Armor, rings and amulets of the realm fall from victories — original pieces, original numbers. They dress the d20 only; mastery wears nothing.</div>")+
    (anyV?"<div class='small dim' style='margin-top:6px'>Worn defense steadies the guard (cap +3), attack sharpens the strike (cap +2), agility widens the crit; health and power deepen the champion's reserves.</div>":"")+"</div>";`,'vault card');

/* 8: wear toggle */
rep(`      else if(act==="wield"){armState();const wc=el.dataset.cls,wi=+el.dataset.i;S.wield[wc]=(S.wield[wc]===wi)?null:wi;}`,
`      else if(act==="wield"){armState();const wc=el.dataset.cls,wi=+el.dataset.i;S.wield[wc]=(S.wield[wc]===wi)?null:wi;}
      else if(act==="wear"){vaultState();const sl=el.dataset.slot,ii=+el.dataset.i;S.gear[sl]=(S.gear[sl]===ii)?null:ii;Sfx.ea("da_flash_equip1_sgl",0.7);}`,'wear toggle');

/* 9: bridge */
rep(`  eaCompJoined, eaCompRoster, masteredTotal, eaCompRec,`,
`  eaCompJoined, eaCompRoster, masteredTotal, eaCompRec,
  vaultState, rollItemDrop, gearHitBonus, gearGuardBonus, gearCritBonus, gearHpBonus, gearManaBonus, wornItems,`,'bridge');

fs.writeFileSync(F,h);
const blocks=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
let bad=0;blocks.forEach((s,i)=>{try{new Function(s)}catch(e){console.log('SYNTAX ERR block',i,e.message);bad++}});
console.log(bad?'FAILED':'ok -',(h.length/1048576).toFixed(1)+'MB,',blocks.length,'blocks');
