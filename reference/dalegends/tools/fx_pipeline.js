/* Export the original combat effects, verbatim:
   - vfx.swf sprite anims (spells, impacts, flourishes) at 25fps
   - vfx_ui.swf battle banners at 24fps
   - the seven resistance damage-burst icons (already exported, fxout/part)
   plan: write ffdec commands; assemble: webp frames into DATA.eaFx/eaPart. */
const fs=require('fs'),{parse}=require('/tmp/dal/meta.js');
const sharp=require('/tmp/dal/npm/node_modules/sharp');
const A='/home/user/Claude-Certified-Architect/reference/dalegends/assets';
const OUT='/tmp/dal/fxout';
const FFDEC='java -Djava.awt.headless=true -Xmx2g -jar /tmp/ffdec/ffdec.jar';

const FX={ /* key -> [swf, symbol] */
  fireballFly:['vfx','sp_fireballProjectile_1'],
  fireballHit:['vfx','sp_fireballTarget_explosion_1'],
  bolt:['vfx','mage_bolt_projectile'],
  boltHit:['vfx','energyExplosion'],
  lightning:['vfx','sp_lightningBolt_1'],
  lightningHit:['vfx','targetLightning'],
  heal:['vfx','sp_heal_1'],
  buff:['vfx','generic_buff'],
  debuff:['vfx','generic_debuff'],
  powerFlash:['vfx','power_strike_flash'],
  levelUp:['vfx','level_up_effect'],
  arrow:['vfx','arrow_projectile'],
  frostFly:['vfx','projectileFrostbite'],
  frostHit:['vfx','targetFrostbite'],
  bGetReady:['vfx_ui','uiFx_getReady'],
  bFight:['vfx_ui','uiFx_fight'],
  bFinalWave:['vfx_ui','uiFx_finalWave'],
  bVictory:['vfx_ui','uiFx_victory'],
  bDefeated:['vfx_ui','uiFx_youWereDefeated'],
  bLevelUp:['vfx_ui','uiFx_levelUp'],
};

if(process.argv[2]==='plan'){
  fs.mkdirSync(OUT,{recursive:true});
  const meta={vfx:parse(A+'/vfx.swf'),vfx_ui:parse(A+'/vfx_ui.swf')};
  const bySwf={vfx:[],vfx_ui:[]};
  const sel={};
  for(const[key,[swf,name]]of Object.entries(FX)){
    const id=meta[swf].symbols[name];
    if(id===undefined){console.error('MISSING',key,name);continue}
    sel[key]={swf,id,name,fps:meta[swf].fps};
    bySwf[swf].push(id);
  }
  fs.writeFileSync(OUT+'/fx.meta.json',JSON.stringify(sel));
  const cmds=[];
  for(const[swf,ids]of Object.entries(bySwf))if(ids.length)
    cmds.push(`${FFDEC} -zoom 1 -selectid ${ids.join(',')} -format sprite:png -export sprite ${OUT}/${swf} ${A}/${swf}.swf`);
  fs.writeFileSync(OUT+'/cmds.txt',cmds.join('\n')+'\n');
  console.log(cmds.length,'commands,',Object.keys(sel).length,'effects');
}

if(process.argv[2]==='assemble'){
(async()=>{
  const sel=JSON.parse(fs.readFileSync(OUT+'/fx.meta.json','utf8'));
  const fx={};
  for(const[key,s]of Object.entries(sel)){
    const dir=`${OUT}/${s.swf}/DefineSprite_${s.id}_${s.name}`;
    if(!fs.existsSync(dir)){console.error('MISSING EXPORT',key);continue}
    const all=fs.readdirSync(dir).filter(f=>f.endsWith('.png')).sort((a,b)=>parseInt(a)-parseInt(b));
    /* keep every other frame on long anims, all frames on short ones */
    const step=all.length>16?2:1;
    const keep=[];for(let i=0;i<all.length;i+=step)keep.push(i);
    if(!keep.includes(all.length-1))keep.push(all.length-1);
    const m0=await sharp(`${dir}/${all[0]}`).metadata();
    const frames=[];
    for(const i of keep){
      const{data,info}=await sharp(`${dir}/${all[i]}`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      const W=info.width,H=info.height;
      let x0=W,y0=H,x1=-1,y1=-1;
      for(let y=0;y<H;y++)for(let x=0;x<W;x++)
        if(data[(y*W+x)*4+3]>8){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
      if(x1<0){frames.push({x:0,y:0,d:''});continue}
      const b=await sharp(`${dir}/${all[i]}`)
        .extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1})
        .webp({quality:78}).toBuffer();
      frames.push({x:x0,y:y0,d:'data:image/webp;base64,'+b.toString('base64')});
    }
    fx[key]={w:m0.width,h:m0.height,ox:m0.width/2,oy:m0.height/2,
      fps:+(s.fps/step).toFixed(2),f:frames};
    console.log(key,all.length,'->',frames.length,'frames',m0.width+'x'+m0.height);
  }
  /* the burst icons */
  const part={};
  const pdirs=fs.readdirSync(OUT+'/part').filter(d=>d.startsWith('DefineSprite'));
  for(const d of pdirs){
    const name=d.replace(/^DefineSprite_\d+_/,'').replace(/_resistance.*$/,'');
    const b=await sharp(`${OUT}/part/${d}/1.png`).webp({quality:80}).toBuffer();
    const m=await sharp(`${OUT}/part/${d}/1.png`).metadata();
    part[name]={w:m.width,h:m.height,d:'data:image/webp;base64,'+b.toString('base64')};
  }
  const out='/* the original combat effects (vfx.swf / vfx_ui.swf) and the\n'+
    '   damage-burst icons, exported verbatim */\n'+
    'DATA.eaFx='+JSON.stringify(fx)+';\n'+
    'DATA.eaPartIcon='+JSON.stringify(part)+';\n';
  fs.writeFileSync('/tmp/dal/fx_payload_lit.js',out);
  console.log('fx payload',(out.length/1048576).toFixed(2)+'MB,',Object.keys(fx).length,'effects,',Object.keys(part).length,'icons');
})().catch(e=>{console.error(e);process.exit(1)});
}
