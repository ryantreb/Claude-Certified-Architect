/* v2: export each creature at its in-game AnimScale (median across CHARCLASS
   entries), trim per frame, webp. zoom>1 scales at draw time (ds) instead. */
const fs=require('fs'),{parse}=require('/tmp/dal/meta.js');
const sharp=require('/tmp/dal/npm/node_modules/sharp');
const ASSETS='/home/user/Claude-Certified-Architect/reference/dalegends/assets';
const OUT='/tmp/dal/out2';
const FFDEC='java -Djava.awt.headless=true -Xmx1g -jar /tmp/ffdec/ffdec.jar';
/* key: swf (skin-composed where the rig art lives in animSkins_*), in-game scale */
const C='/tmp/dal/composed/';
const ROSTER={
 genlock:{swf:C+'genlock',sc:0.95},
 shadeDemon:{swf:C+'shadeDemon',sc:1.2},
 golem:{swf:C+'golem',sc:1},
 corpse:{swf:C+'corpse',sc:1},
 spiders:{swf:'anims_spiders',sc:1},
 ogre:{swf:C+'ogre',sc:1.2},
 skeleton:{swf:C+'skeleton',sc:1},
 rageDemon:{swf:C+'rageDemon',sc:1.1},
 desire:{swf:'anims_desire',sc:1.1},
 deepstalker:{swf:'anims_deepstalker',sc:0.8},
 bronto:{swf:C+'bronto',sc:0.9},
 dragon:{swf:'anims_drakeFire',sc:0.8},      /* baked-art fire drake = the dragon */
 arcaneHorror:{swf:'anims_arcaneHorror',sc:1},
 deymour:{swf:'anims_deymour',sc:1,party:1},
 shale:{swf:C+'shale',sc:1.1,party:1},
 tianne:{swf:'anims_tianne',sc:0.43,party:1},
 soleil:{swf:'anims_soleil',sc:0.35,party:1},
 beirus:{swf:'anims_beirus',sc:1,q:70,party:1},
 mabari:{swf:C+'mabari',sc:0.95,party:1}};
function srcOf(swf){return swf.startsWith('/')?swf+'.swf':ASSETS+'/'+swf+'.swf'}
const WANT=['idleAnim_1','strikeAnim_1','dmgAnim_1','deathAnim_1'];
function pick(meta,party){
  const sel={};
  for(const[name,id]of Object.entries(meta.symbols)){
    for(const w of WANT)if(name.endsWith('_'+w))sel[w.replace('Anim_1','')]={id,name,...meta.sprites[id]};
    if(party&&name.endsWith('_portrait'))sel.portrait={id,name,...meta.sprites[id]};
  }
  return sel;
}
if(process.argv[2]==='plan'){
  fs.mkdirSync(OUT,{recursive:true});
  const cmds=[];
  for(const[key,cfg]of Object.entries(ROSTER)){
    const meta=parse(srcOf(cfg.swf));
    const sel=pick(meta,cfg.party);
    const zoom=Math.min(1,cfg.sc);
    fs.writeFileSync(`${OUT}/${key}.meta.json`,JSON.stringify({key,fps:meta.fps,zoom,ds:+(cfg.sc/zoom).toFixed(3),q:cfg.q||75,step:cfg.step||2,sel}));
    const ids=Object.values(sel).map(s=>s.id).join(',');
    cmds.push(`${FFDEC} -zoom ${zoom} -selectid ${ids} -export sprite ${OUT}/${key}.png ${srcOf(cfg.swf)}`);
    cmds.push(`${FFDEC} -selectid ${ids} -format sprite:svg -export sprite ${OUT}/${key}.svg ${srcOf(cfg.swf)}`);
  }
  fs.writeFileSync('/tmp/dal/cmds2.txt',cmds.join('\n')+'\n');
  console.log(cmds.length,'commands');
}
const HEAVY={golem:1,ogre:1,bronto:1,dragon:1,deymour:1,beirus:1,spiders:1};
function stepFor(key,kind){const hv=HEAVY[key];if(kind==='death')return hv?4:3;if(kind==='dmg')return hv?3:2;if(kind==='idle')return hv?3:2;return 2}
if(process.argv[2]==='assemble'){
(async()=>{
  const rig={};
  for(const key of Object.keys(ROSTER)){
    const{fps,zoom,ds,sel}=JSON.parse(fs.readFileSync(`${OUT}/${key}.meta.json`));
    const entry={ds,anims:{}};const q=70;
    for(const[kind,s]of Object.entries(sel)){
      const dirP=`${OUT}/${key}.png/DefineSprite_${s.id}_${s.name}`;
      const dirS=`${OUT}/${key}.svg/DefineSprite_${s.id}_${s.name}`;
      if(!fs.existsSync(dirP)){console.error('MISSING',key,kind);continue}
      if(kind==='portrait'){
        const b=await sharp(`${dirP}/1.png`).webp({quality:82}).toBuffer();
        entry.portrait='data:image/webp;base64,'+b.toString('base64');continue;
      }
      const all=fs.readdirSync(dirP).filter(f=>f.endsWith('.png')).sort((a,b)=>parseInt(a)-parseInt(b));
      const af=s.labels&&s.labels.action_frame!=null?s.labels.action_frame:null;
      const step=stepFor(key,kind);
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
      entry.anims[kind]={w:meta0.width,h:meta0.height,ox,oy,fps:+(fps/step).toFixed(2),
        af:af!=null?keep.indexOf(af):null,f:frames};
    }
    rig[key]=entry;
    let sz=0;for(const a of Object.values(entry.anims))sz+=a.f.reduce((t,f)=>t+f.d.length,0);
    console.log(key,(sz/1048576).toFixed(2)+'MB');
  }
  const bgs={};
  for(const d of fs.readdirSync('/tmp/dal/out'))if(d.startsWith('bg_battleBG')){
    const b=await sharp(`/tmp/dal/out/${d}/1.png`).webp({quality:80}).toBuffer();
    bgs[d.replace('bg_battleBG','')]='data:image/webp;base64,'+b.toString('base64');
  }
  const js='/* DA Legends verbatim assets: rendered from the original SWFs at in-game\n   AnimScale, original palettes, action_frame timings preserved. */\n'
    +'DATA.eaRig='+JSON.stringify(rig)+';\n'
    +'DATA.eaBg='+JSON.stringify(bgs)+';\n';
  fs.writeFileSync(`${OUT}/ea_payload.js`,js);
  console.log('payload',(fs.statSync(`${OUT}/ea_payload.js`).size/1048576).toFixed(2)+'MB');
})().catch(e=>{console.error(e);process.exit(1)});
}
