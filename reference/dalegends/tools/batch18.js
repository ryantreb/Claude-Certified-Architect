/* Batch for pass 18/19 art: compose 16 SWFs (8 encounter mobs incl. Raspin,
   4 guild companions, 4 hero Standard outfits), all verbatim originals. */
const fs=require('fs'),cp=require('child_process'),{parse}=require('/tmp/dal/meta.js');
const A='/home/user/Claude-Certified-Architect/reference/dalegends/assets';
const OUT='/tmp/dal/composedMore';
fs.mkdirSync(OUT,{recursive:true});

function pickWeapon(file,avoid){
  const s=Object.keys(parse(A+'/'+file+'.swf').symbols).filter(n=>n.endsWith('_weapon'));
  const pick=s.find(n=>!/starter/i.test(n)&&(!avoid||!n.includes(avoid)))||s[0];
  return pick.replace(/_weapon$/,'');
}
const sword1=pickWeapon('animSkins_Weapons_1h_Swords');
const sword2=pickWeapon('animSkins_Weapons_2h_Swords');
const axe1=pickWeapon('animSkins_Weapons_1h_Axes','dwarf');
const dagger=pickWeapon('animSkins_Weapons_daggers');
const staff=pickWeapon('animSkins_Weapons_staves');
const bowAny=(()=>{const s=Object.keys(parse(A+'/animSkins_Weapons_bow.swf').symbols).filter(n=>n.endsWith('_weapon'));
  return (s.find(n=>!/starter/i.test(n))||s[0]).replace(/_weapon$/,'')})();
console.log('weapons:',{sword1,sword2,axe1,dagger,staff,bowAny});

const C=(rig,out,skins)=>({rig:`${A}/${rig}.swf`,out:`${OUT}/${out}.swf`,skins});
const CONFIGS=[
  /* encounter mobs */
  C('anims_HumanoidMob_1H','raspin',[
    {swf:`${A}/animSkins_Bandit_Heavy_Standard.swf`,prefix:'banditLeader_m'},
    {swf:`${A}/animSkins_Weapons_1h_Swords.swf`,prefix:sword1,extra:{weapon:sword1+'_weapon'}}]),
  C('anims_HumanoidMob_1H','bandit1H',[
    {swf:`${A}/animSkins_Bandit_Leather_Standard.swf`,prefix:'banditRuffian_m'},
    {swf:`${A}/animSkins_Weapons_1h_Axes.swf`,prefix:axe1,extra:{weapon:axe1+'_weapon'}}]),
  C('anims_HumanoidMob_STAFF','banditMage',[
    {swf:`${A}/animSkins_Bandit_Robe_Standard.swf`,prefix:'banditApostate_m'},
    {swf:`${A}/animSkins_Weapons_staves.swf`,prefix:staff,extra:{weapon:staff+'_weapon'}}]),
  C('anims_HumanoidMob_BOW','banditBow',[
    {swf:`${A}/animSkins_Bandit_Leather_Standard.swf`,prefix:'banditHunter_m'},
    {swf:`${A}/animSkins_Weapons_bow.swf`,prefix:bowAny,extra:{wp_bow:bowAny+'_weapon'}}]),
  C('anims_hurlock_1H','hurlock1H',[
    {swf:`${A}/animSkins_HumanElf_Hurlock.swf`,prefix:'hurlockAlphaNormal_m'},
    {swf:`${A}/animSkins_Weapons_1h_Swords.swf`,prefix:sword1,extra:{weapon:sword1+'_weapon'}}]),
  C('anims_hurlock_2H','hurlock2H',[
    {swf:`${A}/animSkins_HumanElf_Hurlock.swf`,prefix:'hurlockAlphaNormal_m'},
    {swf:`${A}/animSkins_Weapons_2h_Swords.swf`,prefix:sword2,extra:{weapon:sword2+'_weapon'}}]),
  C('anims_hurlock_STAFF','hurlockStaff',[
    {swf:`${A}/animSkins_HumanElf_Hurlock.swf`,prefix:'hurlockShamanRobe_m'},
    {swf:`${A}/animSkins_Weapons_staves.swf`,prefix:staff,extra:{weapon:staff+'_weapon'}}]),
  C('anims_DwarfMob_2H','carta2H',[
    {swf:`${A}/animSkins_Monsters_CartaDwarves.swf`,prefix:'cartaDwarfWarrior'},
    {swf:`${A}/animSkins_Weapons_2h_Axes.swf`,prefix:'greatAxe_dwarf',extra:{weapon:'greatAxe_dwarf_weapon'}}]),
  /* guild companions (Standard looks + their own preset heads) */
  C('anims_HumanElf_2H','compVan',[
    {swf:`${A}/animSkins_HumanElf_Heavy_Standard.swf`,prefix:'silverliteArmor_m'},
    {swf:`${A}/animSkins_Weapons_2h_Swords.swf`,prefix:sword2,extra:{weapon:sword2+'_weapon'}},
    {swf:'/tmp/dal/composedHero/headCompVan.swf',prefix:'hfHead'}]),
  C('anims_HumanElf_DUAL','compSha',[
    {swf:`${A}/animSkins_HumanElf_Leather_Standard.swf`,prefix:'commandersPleather_f'},
    {swf:`${A}/animSkins_Weapons_daggers.swf`,prefix:dagger,extra:{weaponR:dagger+'_weapon'}},
    {swf:'/tmp/dal/composedHero/headCompSha.swf',prefix:'hfHead'}]),
  C('anims_HumanElf_STAFF','compCas',[
    {swf:`${A}/animSkins_HumanElf_Robe_Standard.swf`,prefix:'robesOfFortitude_m',
     extra:{skirt:'robesOfFortitude_fwd_1_skirt',skirtGradient:'robesOfFortitude_skirtGradient'}},
    {swf:`${A}/animSkins_Weapons_staves.swf`,prefix:staff,extra:{weapon:staff+'_weapon'}},
    {swf:'/tmp/dal/composedHero/headCompCas.swf',prefix:'hfHead'}]),
  C('anims_HumanElf_BOW','compRng',[
    {swf:`${A}/animSkins_HumanElf_Leather_Standard.swf`,prefix:'tornLeatherArmor_f'},
    {swf:`${A}/animSkins_Weapons_bow.swf`,prefix:bowAny,extra:{wp_bow:bowAny+'_weapon'}},
    {swf:'/tmp/dal/composedHero/headCompRng.swf',prefix:'hfHead'}]),
  /* hero Standard outfits (visible equipment tier 2) — same heads, new armor */
  C('anims_HumanElf_2H','heroWarStd',[
    {swf:`${A}/animSkins_HumanElf_Heavy_Standard.swf`,prefix:'powerArmor_m'},
    {swf:`${A}/animSkins_Weapons_2h_Swords.swf`,prefix:'starterGreatsword'},
    {swf:'/tmp/dal/composedHero/headWar.swf',prefix:'hfHead'}]),
  C('anims_HumanElf_DUAL','heroRogStd',[
    {swf:`${A}/animSkins_HumanElf_Leather_Standard.swf`,prefix:'reinforcedLeather_f'},
    {swf:`${A}/animSkins_Weapons_daggers.swf`,prefix:'starterDagger',extra:{weaponR:'starterDagger_weapon'}},
    {swf:'/tmp/dal/composedHero/headRog.swf',prefix:'hfHead'}]),
  C('anims_HumanElf_STAFF','heroMagStd',[
    {swf:`${A}/animSkins_HumanElf_Robe_Standard.swf`,prefix:'robesOfBronze_m',
     extra:{skirt:'robesOfBronze_fwd_1_skirt',skirtGradient:'robesOfBronze_skirtGradient'}},
    {swf:`${A}/animSkins_Weapons_staves.swf`,prefix:'starterStaff'},
    {swf:'/tmp/dal/composedHero/headMag.swf',prefix:'hfHead'}]),
  C('anims_HumanElf_BOW','heroArcStd',[
    {swf:`${A}/animSkins_HumanElf_Leather_Standard.swf`,prefix:'bronzedLeatherArmor_f'},
    {swf:`${A}/animSkins_Weapons_bow.swf`,prefix:'bow_starterShort',extra:{wp_bow:'bow_starterShort_weapon'}},
    {swf:'/tmp/dal/composedHero/headArc.swf',prefix:'hfHead'}]),
];
for(const cfg of CONFIGS){
  const j=`/tmp/dal/cfg_${cfg.out.split('/').pop().replace('.swf','')}.json`;
  fs.writeFileSync(j,JSON.stringify(cfg));
  console.log('composing',cfg.out.split('/').pop());
  try{cp.execSync(`node /tmp/dal/compose2.js ${j}`,{stdio:['ignore','pipe','pipe']});}
  catch(e){console.log('FAILED',cfg.out,String(e.stderr||e.message).slice(0,300))}
}
console.log('batch done');
