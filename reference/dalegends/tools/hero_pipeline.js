/* The four original player-hero loadouts: HumanElf weapon-class rigs with
   their baked outfits, exported verbatim (zoom 1 = the in-game AnimScale of
   the player classes). Emits Object.assign(DATA.eaRig,{heroWar,...}). */
const fs=require('fs'),{parse}=require('/tmp/dal/meta.js');
const sharp=require('/tmp/dal/npm/node_modules/sharp');
const ASSETS='/home/user/Claude-Certified-Architect/reference/dalegends/assets';
const OUT='/tmp/dal/outHero';
const FFDEC='java -Djava.awt.headless=true -Xmx1g -jar /tmp/ffdec/ffdec.jar';
/* rigs pre-composed with the original starter armor + starter weapon skins
   (compose2.js: quartzArmor/rippedLeather/dirtyRobes + starter weapons) */
const HEROES={
  heroWar:{swf:'/tmp/dal/composedHero/heroWar',pre:'hf_2H_mail1'},
  heroRog:{swf:'/tmp/dal/composedHero/heroRog',pre:'hf_dual_mail1'},
  heroMag:{swf:'/tmp/dal/composedHero/heroMag',pre:'hf_staff_cloth1'},
  heroArc:{swf:'/tmp/dal/composedHero/heroArc',pre:'hf_bow_mail1'}
};
function srcOf(s){return s.startsWith('/')?s+'.swf':`${ASSETS}/${s}.swf`}
const KINDS={idle:'idle_1',strike:'attack_1',special:'special_1',dmg:'dmg_1',
  death:'death_1',fwd:'fwd_1',evade:'evade',block:'defend_1',portrait:'portrait'};
function stepFor(kind){return kind==='death'?3:(kind==='special'?3:2)}

if(process.argv[2]==='plan'){
  fs.mkdirSync(OUT,{recursive:true});
  const cmds=[];
  for(const[key,cfg]of Object.entries(HEROES)){
    const src=srcOf(cfg.swf);
    const meta=parse(src);
    const sel={};
    for(const[kind,suffix]of Object.entries(KINDS)){
      const name=cfg.pre+'_'+suffix;
      const id=meta.symbols[name];
      if(id===undefined){console.error('MISSING SYMBOL',key,name);continue}
      sel[kind]={id,name,...meta.sprites[id]};
    }
    fs.writeFileSync(`${OUT}/${key}.meta.json`,JSON.stringify({key,fps:meta.fps,zoom:1,ds:1,sel}));
    const ids=Object.values(sel).map(s=>s.id).join(',');
    cmds.push(`${FFDEC} -zoom 1 -selectid ${ids} -export sprite ${OUT}/${key}.png ${src}`);
    cmds.push(`${FFDEC} -selectid ${ids} -format sprite:svg -export sprite ${OUT}/${key}.svg ${src}`);
  }
  fs.writeFileSync('/tmp/dal/cmdsHero.txt',cmds.join('\n')+'\n');
  console.log(cmds.length,'commands');
}

if(process.argv[2]==='assemble'){
(async()=>{
  const rig={};
  for(const key of Object.keys(HEROES)){
    const{fps,zoom,ds,sel}=JSON.parse(fs.readFileSync(`${OUT}/${key}.meta.json`));
    const entry={ds,anims:{}};const q=70;
    for(const[kind,s]of Object.entries(sel)){
      const dirP=`${OUT}/${key}.png/DefineSprite_${s.id}_${s.name}`;
      const dirS=`${OUT}/${key}.svg/DefineSprite_${s.id}_${s.name}`;
      if(!fs.existsSync(dirP)){console.error('MISSING EXPORT',key,kind);continue}
      if(kind==='portrait'){
        const b=await sharp(`${dirP}/1.png`).webp({quality:82}).toBuffer();
        entry.portrait='data:image/webp;base64,'+b.toString('base64');continue;
      }
      const all=fs.readdirSync(dirP).filter(f=>f.endsWith('.png')).sort((a,b)=>parseInt(a)-parseInt(b));
      const af=s.labels&&s.labels.action_frame!=null?s.labels.action_frame:null;
      const step=stepFor(kind);
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
        if(m){ox=+(+m[1]*zoom).toFixed(1);oy=+(+m[2]*zoom).toFixed(1)}
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
    rig[key]=entry;
    console.log(key,Object.keys(entry.anims).join(','),
      (JSON.stringify(entry).length/1048576).toFixed(2)+'MB');
  }
  fs.writeFileSync('/tmp/dal/hero_payload.js',
    '/* the four original player-hero loadouts (HumanElf weapon-class rigs, baked outfits) */\n'+
    'Object.assign(DATA.eaRig,'+JSON.stringify(rig)+');\n');
  console.log('hero payload',(fs.statSync('/tmp/dal/hero_payload.js').size/1048576).toFixed(2)+'MB');
})().catch(e=>{console.error(e);process.exit(1)});
}
