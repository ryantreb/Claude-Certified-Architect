/* Export the pass-18 battle sprites: 8 composed mobs + 4 self-contained
   creatures + 4 guild companions + 4 hero Standard outfits. Handles both
   timeline contracts (monster *Anim_N and player-style *_N). */
const fs=require('fs'),{parse}=require('/tmp/dal/meta.js');
const sharp=require('/tmp/dal/npm/node_modules/sharp');
const A='/home/user/Claude-Certified-Architect/reference/dalegends/assets';
const CM='/tmp/dal/composedMore';
const OUT='/tmp/dal/outMore';
const FFDEC='java -Djava.awt.headless=true -Xmx1g -jar /tmp/ffdec/ffdec.jar';

/* key -> {swf, pre, scale} ; foes need idle/strike/dmg/death/fwd+portrait,
   party sprites need the hero kind set */
const MOBS={
  raspin:{swf:`${CM}/raspin.swf`,pre:'humanoidMob1H'},
  bandit1H:{swf:`${CM}/bandit1H.swf`,pre:'humanoidMob1H'},
  banditMage:{swf:`${CM}/banditMage.swf`,pre:'humanoidMobSTAFF'},
  banditBow:{swf:`${CM}/banditBow.swf`,pre:'humanoidMobBOW'},
  hurlock1H:{swf:`${CM}/hurlock1H.swf`,pre:'hurlock1H'},
  hurlock2H:{swf:`${CM}/hurlock2H.swf`,pre:'hurlock2H'},
  hurlockStaff:{swf:`${CM}/hurlockStaff.swf`,pre:'hurlockSTAFF'},
  carta2H:{swf:`${CM}/carta2H.swf`,pre:'dwarfMob2H'},
  sylvan:{swf:`${A}/anims_sylvan.swf`,pre:'sylvan'},
  werewolf:{swf:`${A}/anims_werewolf.swf`,pre:'werewolf'},
  bear:{swf:`${A}/anims_bear.swf`,pre:'bear'},
  shriek:{swf:`${A}/anims_shriek.swf`,pre:'shr'},
};
const PARTY={
  compVan:{swf:`${CM}/compVan.swf`,pre:'hf_2H_mail1'},
  compSha:{swf:`${CM}/compSha.swf`,pre:'hf_dual_mail1'},
  compCas:{swf:`${CM}/compCas.swf`,pre:'hf_staff_cloth1'},
  compRng:{swf:`${CM}/compRng.swf`,pre:'hf_bow_mail1'},
  heroWarStd:{swf:`${CM}/heroWarStd.swf`,pre:'hf_2H_mail1'},
  heroRogStd:{swf:`${CM}/heroRogStd.swf`,pre:'hf_dual_mail1'},
  heroMagStd:{swf:`${CM}/heroMagStd.swf`,pre:'hf_staff_cloth1'},
  heroArcStd:{swf:`${CM}/heroArcStd.swf`,pre:'hf_bow_mail1'},
};
const FOE_KINDS={idle:['idleAnim_1','idle_1'],strike:['strikeAnim_1','attack_1','ba_strike'],
  dmg:['dmgAnim_1','dmg_1'],death:['deathAnim_1','death_1'],fwd:['fwdAnim_1','fwd_1'],
  portrait:['portrait']};
const HERO_KINDS={idle:['idle_1'],strike:['attack_1'],special:['special_1'],dmg:['dmg_1'],
  death:['death_1'],fwd:['fwd_1'],evade:['evade'],block:['defend_1'],portrait:['portrait']};

function resolve(meta,pre,alts){
  for(const a of alts){
    const n=pre+'_'+a;
    if(meta.symbols[n]!==undefined)return {id:meta.symbols[n],name:n};
  }
  /* case-insensitive prefix rescue (humanoidMobSTAFF vs humanoidMobStaff) */
  for(const a of alts){
    const want=(pre+'_'+a).toLowerCase();
    for(const[nm,id]of Object.entries(meta.symbols))
      if(nm.toLowerCase()===want)return {id,name:nm};
  }
  return null;
}

if(process.argv[2]==='plan'){
  fs.mkdirSync(OUT,{recursive:true});
  const cmds=[];
  for(const[key,cfg]of Object.entries({...MOBS,...PARTY})){
    if(!fs.existsSync(cfg.swf)){console.error('NO SWF',key);continue}
    const meta=parse(cfg.swf);
    const kinds=PARTY[key]?HERO_KINDS:FOE_KINDS;
    const sel={};
    for(const[kind,alts]of Object.entries(kinds)){
      const r=resolve(meta,cfg.pre,alts);
      if(!r){if(kind!=='portrait'&&kind!=='special'&&kind!=='evade'&&kind!=='block')console.error('MISS',key,kind);continue}
      sel[kind]={id:r.id,name:r.name,...meta.sprites[r.id]};
    }
    fs.writeFileSync(`${OUT}/${key}.meta.json`,JSON.stringify({key,fps:meta.fps,sel}));
    const ids=Object.values(sel).map(s=>s.id).join(',');
    cmds.push(`${FFDEC} -zoom 1 -selectid ${ids} -export sprite ${OUT}/${key}.png ${cfg.swf}`);
    cmds.push(`${FFDEC} -selectid ${ids} -format sprite:svg -export sprite ${OUT}/${key}.svg ${cfg.swf}`);
  }
  fs.writeFileSync('/tmp/dal/cmdsMore.txt',cmds.join('\n')+'\n');
  console.log(cmds.length,'commands');
}

if(process.argv[2]==='assemble'){
(async()=>{
  const rig={};
  for(const key of Object.keys({...MOBS,...PARTY})){
    const mp=`${OUT}/${key}.meta.json`;
    if(!fs.existsSync(mp))continue;
    const{fps,sel}=JSON.parse(fs.readFileSync(mp));
    const entry={ds:1,anims:{}};const q=68;
    for(const[kind,s]of Object.entries(sel)){
      const dirP=`${OUT}/${key}.png/DefineSprite_${s.id}_${s.name}`;
      const dirS=`${OUT}/${key}.svg/DefineSprite_${s.id}_${s.name}`;
      if(!fs.existsSync(dirP)){console.error('MISSING EXPORT',key,kind);continue}
      if(kind==='portrait'){
        const b=await sharp(`${dirP}/1.png`).webp({quality:80}).toBuffer();
        entry.portrait='data:image/webp;base64,'+b.toString('base64');continue;
      }
      const all=fs.readdirSync(dirP).filter(f=>f.endsWith('.png')).sort((a,b)=>parseInt(a)-parseInt(b));
      const af=s.labels&&s.labels.action_frame!=null?s.labels.action_frame:null;
      const step=kind==='death'?3:2;
      const keep=[];
      for(let i=0;i<all.length;i+=step)keep.push(i);
      if(af!=null&&!keep.includes(af))keep.push(af);
      if(!keep.includes(all.length-1))keep.push(all.length-1);
      keep.sort((a,b)=>a-b);
      let ox=null,oy=null;
      try{
        const svg=fs.readFileSync(`${dirS}/1.svg`,'utf8');
        let m=svg.match(/<g transform="matrix\(1\.0, 0\.0, 0\.0, 1\.0, ([\d.eE+-]+), ([\d.eE+-]+)\)">\s*<use[^>]*ffdec:characterId="1"/);
        if(!m)m=svg.match(/<g transform="matrix\(1\.0, 0\.0, 0\.0, 1\.0, ([\d.eE+-]+), ([\d.eE+-]+)\)">/);
        if(m){ox=+(+m[1]).toFixed(1);oy=+(+m[2]).toFixed(1)}
      }catch(e){}
      const meta0=await sharp(`${dirP}/${all[0]}`).metadata();
      if(ox==null){ox=meta0.width/2;oy=meta0.height}
      const frames=[];
      for(const i of keep){
        const{data,info}=await sharp(`${dirP}/${all[i]}`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
        const W=info.width,H=info.height;
        let x0=W,y0=H,x1=-1,y1=-1;
        for(let y=0;y<H;y++)for(let x=0;x<W;x++)
          if(data[(y*W+x)*4+3]>8){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
        if(x1<0){frames.push({x:0,y:0,d:''});continue}
        const b=await sharp(`${dirP}/${all[i]}`)
          .extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1})
          .webp({quality:q}).toBuffer();
        frames.push({x:x0,y:y0,d:'data:image/webp;base64,'+b.toString('base64')});
      }
      const kfps=fps/step;
      const afK=af!=null?keep.indexOf(af):null;
      entry.anims[kind]={w:meta0.width,h:meta0.height,ox,oy,fps:+kfps.toFixed(2),
        af:afK!=null&&afK>=0?afK:null,f:frames};
    }
    if(Object.keys(entry.anims).length)rig[key]=entry;
    console.log(key,Object.keys(entry.anims).join(','),(JSON.stringify(entry).length/1048576).toFixed(2)+'MB');
  }
  fs.writeFileSync('/tmp/dal/more_payload.js',
    '/* pass-18 battle sprites: encounter mobs, guild companions, hero Standard outfits */\n'+
    'Object.assign(DATA.eaRig,'+JSON.stringify(rig)+');\n');
  console.log('payload',(fs.statSync('/tmp/dal/more_payload.js').size/1048576).toFixed(2)+'MB');
})().catch(e=>{console.error(e);process.exit(1)});
}
