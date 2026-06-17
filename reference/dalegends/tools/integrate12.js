/* Pass 12: the original special effects.
   DATA.eaFx carries vfx.swf spell/impact anims and the vfx_ui battle banners;
   DATA.eaPartIcon the seven damage-burst icons. The burst engine runs the
   original ParticleSys math verbatim (random 360° seeding, v=rand(velRand)/2
   +velocity, gravity g·f/10 accumulation, constant force lift, size/alpha
   lerp at 24fps; numbers straight from EFFECTS_PARTICLEEFFECTS.xml).
   Presentation only — reduced-motion silences all of it. */
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
fs.readFileSync('/tmp/dal/fx_payload_lit.js','utf8').trim()+`
/* enemy stat medians from the original CHARACTER_CHARCLASS.xml, keyed by foe shape`,'fx payload');

/* 2: the effects engine */
rep(`/* ---- original voice barks: by champion build; foes grunt by shape ---- */`,
`/* ---- the original effects engine ----
   Sprite anims play in screen space at their source fps; bursts integrate the
   original ParticleSys step (24fps): v=rand(velRand)/2+vel at a random 360°
   angle, gravity accumulates g·f/10 per frame, force lifts, size lerps to 0. */
const FXQ={anims:[],parts:[]};
const FXIMG={};
function fxFrames(key){
  const e=DATA.eaFx&&DATA.eaFx[key];if(!e)return null;
  if(!FXIMG[key])FXIMG[key]=e.f.map(fr=>{if(!fr.d)return null;const im=new Image();im.src=fr.d;return im});
  return FXIMG[key];
}
let FXPI={};
function fxPartImg(name){
  const p=DATA.eaPartIcon&&DATA.eaPartIcon[name];if(!p)return null;
  if(!FXPI[name]){FXPI[name]=new Image();FXPI[name].src=p.d}
  return FXPI[name];
}
/* x,y in screen px; opts: {at, to:{x,y,dur}, scale, banner} */
function spawnFx(key,x,y,opts){
  if(!S.settings.motion||!DATA.eaFx||!DATA.eaFx[key])return false;
  const o=opts||{};
  fxFrames(key);
  FXQ.anims.push({key,x:x||0,y:y||0,t0:o.at||nowSec(),to:o.to||null,
    scale:o.scale||1,banner:!!o.banner});
  return true;
}
/* verbatim EFFECTS_PARTICLEEFFECTS.xml rows (life .5, size 5→0, vel 4+r40/2,
   gravity 30@270°, force 50; pools: melee/ranged/fire/shock/cold/nature 25, magic 18) */
const EAPART={
  melee:{icon:"resistanceMelee",pool:25},ranged:{icon:"resistanceRanged",pool:25},
  magic:{icon:"resistanceMagic",pool:18},fire:{icon:"resistanceFire",pool:25},
  shock:{icon:"resistanceShock",pool:25},cold:{icon:"resistanceCold",pool:25},
  nature:{icon:"resistanceNature",pool:25}};
const EAPART_PHYS={life:0.5,sizeStart:5,sizeEnd:0,vel:4,velRand:40,grav:30,gravAngle:270,force:50,fps:24};
function burstFx(kind,x,y,scale){
  if(!S.settings.motion)return false;
  const d=EAPART[kind];if(!d||!fxPartImg(d.icon))return false;
  const P=EAPART_PHYS,rad=Math.PI/180;
  const ps=[];
  for(let i=0;i<d.pool;i++)ps.push({
    x:x+Math.random()*10,y:y+Math.random()*10,
    a:Math.random()*360,v:Math.random()*P.velRand/2+P.vel});
  FXQ.parts.push({icon:d.icon,t0:nowSec(),ps,scale:scale||1,
    gx:P.grav*Math.cos(P.gravAngle*rad),gy:-(P.grav*Math.sin(P.gravAngle*rad))});
  return true;
}
function drawFxLayer(w,h,stageScale){
  const t=nowSec(),rad=Math.PI/180,P=EAPART_PHYS;
  /* bursts */
  for(let i=FXQ.parts.length-1;i>=0;i--){
    const B2=FXQ.parts[i];
    const f=Math.floor((t-B2.t0)*P.fps);
    if(f>P.life*P.fps){FXQ.parts.splice(i,1);continue}
    const im=fxPartImg(B2.icon);
    if(!im||!im.complete||!im.naturalWidth)continue;
    const sizeNow=P.sizeStart+(P.sizeEnd-P.sizeStart)*(f/(P.life*P.fps));
    /* icons were exported at 4× zoom; /4 returns them to stage-native size */
    const dw=(im.naturalWidth/4)*sizeNow*0.22*B2.scale*stageScale;
    for(const p of B2.ps){
      const px=p.x+(p.v*Math.cos(p.a*rad)*f+B2.gx*f*(f+1)/20)*stageScale;
      const py=p.y+(-(p.v*Math.sin(p.a*rad))*f+B2.gy*f*(f+1)/20-P.force*f/P.fps)*stageScale;
      ctx.drawImage(im,px-dw/2,py-dw/2,dw,dw*(im.naturalHeight/im.naturalWidth));
    }
  }
  /* sprite anims */
  for(let i=FXQ.anims.length-1;i>=0;i--){
    const a=FXQ.anims[i];
    const e=DATA.eaFx[a.key];if(!e){FXQ.anims.splice(i,1);continue}
    if(t<a.t0)continue;
    const dur=e.f.length/e.fps;
    const k=(t-a.t0)/dur;
    if(k>=1){FXQ.anims.splice(i,1);continue}
    const fi=Math.min(e.f.length-1,Math.floor(k*e.f.length));
    const ims=fxFrames(a.key);const im=ims&&ims[fi];
    const fr=e.f[fi];
    if(!im||!im.complete||!im.naturalWidth||!fr.d)continue;
    let cx=a.x,cy=a.y,sc;
    if(a.banner){
      sc=Math.min((w*0.72)/e.w,(h*0.3)/e.h);
      cx=w/2;cy=h*0.34;
    }else{
      sc=a.scale*stageScale;
      if(a.to)
        {cx=a.x+(a.to.x-a.x)*Math.min(1,(t-a.t0)/(a.to.dur||0.25));
         cy=a.y+(a.to.y-a.y)*Math.min(1,(t-a.t0)/(a.to.dur||0.25))}
    }
    ctx.globalAlpha=a.banner?Math.min(1,(1-k)*4):1;
    ctx.drawImage(im,cx+(fr.x-e.ox)*sc,cy+(fr.y-e.oy)*sc,im.naturalWidth*sc,im.naturalHeight*sc);
    ctx.globalAlpha=1;
  }
}
/* spawn-point helpers: the renderer caches unit screen homes each frame */
function fxAtFoe(i){const p=B&&B.foeScreen&&B.foeScreen[i];return p?{x:p.x,y:p.y-22*EAST.sc}:null}
function fxAtMember(i){const p=B&&B.partyScreen&&B.partyScreen[i];return p?{x:p.x,y:p.y-22*EAST.sc}:null}
/* class-aware strike dressing: projectile, impact anim, original burst */
function strikeFx(cls,anim,mi,targets,crit){
  const from=fxAtMember(mi);
  targets.forEach(j=>{
    const at=fxAtFoe(j);if(!at)return;
    let burst="melee",fly=null,hit=null;
    if(cls==="ranger"){burst="ranged";fly="arrow"}
    else if(cls==="caster"){
      if(anim==="frost"){burst="cold";fly="frostFly";hit="frostHit"}
      else if(anim==="chain"){burst="shock";hit="lightningHit";spawnFx("lightning",at.x,at.y-60*EAST.sc)}
      else{burst="magic";fly="bolt";hit="boltHit"}
    }
    const flyDur=0.22;
    if(fly&&from)spawnFx(fly,from.x,from.y,{to:{x:at.x,y:at.y,dur:flyDur}});
    const impactAt=nowSec()+(fly?flyDur:0.05);
    if(hit)spawnFx(hit,at.x,at.y,{at:impactAt,scale:0.5});
    setTimeout(()=>{burstFx(burst,at.x,at.y)},(fly?flyDur:0.05)*1000);
  });
  if(crit&&from)spawnFx("powerFlash",from.x,from.y-30*EAST.sc,{scale:0.4});
}
/* ---- original voice barks: by champion build; foes grunt by shape ---- */`,'fx engine');

/* 3: render hook — effects ride above units, below the floaters */
rep(`  const tf3=nowSec();
  B.fx.floaters=B.fx.floaters.filter(f=>tf3-f.t0<1.25);`,
`  drawFxLayer(w,h,scale);
  const tf3=nowSec();
  B.fx.floaters=B.fx.floaters.filter(f=>tf3-f.t0<1.25);`,'render hook');

/* 4: strikes spawn their original dressing */
rep(`  const atkM=B.party[sel.member];
  if(atkM&&atkM.kind==="hero"&&Math.random()<0.6)heroBark("atk");`,
`  const atkM=B.party[sel.member];
  strikeFx(atkM&&atkM.cls,sel.sk.anim,sel.member,targets,crit);
  if(atkM&&atkM.kind==="hero"&&Math.random()<0.6)heroBark("atk");`,'strike fx');

/* 5: blows on the party bleed where they land */
rep(`  Sfx.play("bad");
  Sfx.ea("impact23",0.7);
  if(victim.kind==="hero")heroBark(victim.halves<=0?"death":"pain");`,
`  Sfx.play("bad");
  Sfx.ea("impact23",0.7);
  {const at=fxAtMember(B.defMember);
   if(at)burstFx("melee",at.x,at.y)}
  if(victim.kind==="hero")heroBark(victim.halves<=0?"death":"pain");`,'pain fx');

rep(`  Sfx.play("bad");
  Sfx.ea("fxe_shockwave_p",0.7);
  if(hit.some(m=>m.kind==="hero"))heroBark("pain");`,
`  Sfx.play("bad");
  Sfx.ea("fxe_shockwave_p",0.7);
  hit.forEach(m=>{const mi=B.party.indexOf(m);const at=fxAtMember(mi);
    if(at)burstFx("melee",at.x,at.y)});
  if(hit.some(m=>m.kind==="hero"))heroBark("pain");`,'sweep fx');

/* 6: the riposte draws blood too */
rep(`      addFloater("RIPOSTE -"+fmtH(1),0.64,-88,"#ffd98f",15);
    }
  }
  Sfx.play("good");`,
`      addFloater("RIPOSTE -"+fmtH(1),0.64,-88,"#ffd98f",15);
      const at=fxAtFoe(B.defFoe);
      if(at)burstFx("melee",at.x,at.y);
    }
  }
  Sfx.play("good");`,'riposte fx');

/* 7: battle banners — Get Ready / Fight (Final Wave for bosses) */
rep(`  MODE="battle";
  Music.sync();
  Sfx.ea("combat_start_B",0.7);
  if(cfg.boss)Sfx.ea("Heartbeat",0.9);`,
`  MODE="battle";
  Music.sync();
  Sfx.ea("combat_start_B",0.7);
  if(cfg.boss)Sfx.ea("Heartbeat",0.9);
  FXQ.anims.length=0;FXQ.parts.length=0;
  spawnFx(cfg.boss?"bFinalWave":"bGetReady",0,0,{banner:true});
  spawnFx("bFight",0,0,{banner:true,at:nowSec()+1.0});`,'banners');

/* 8: level-up plays its original flourish over the champion */
rep(`  html+="<div class='rewardline'><span class='ric'>✦</span><span>+"+shards+" aether shards · +"+(wasBoss?45:15)+" xp"+(ups?" · LEVEL UP!":"")+"</span></div>";`,
`  if(ups){spawnFx("bLevelUp",0,0,{banner:true});
    const hi=B&&B.party?B.party.findIndex(m=>m.kind==="hero"):-1;
    const at=hi>=0?fxAtMember(hi):null;
    if(at)spawnFx("levelUp",at.x,at.y,{scale:0.8});}
  html+="<div class='rewardline'><span class='ric'>✦</span><span>+"+shards+" aether shards · +"+(wasBoss?45:15)+" xp"+(ups?" · LEVEL UP!":"")+"</span></div>";`,'levelup fx');

/* 9: tonics glow with the original heal */
rep(`  S.consume.tonic--;hurt.halves=Math.min(hurt.max,hurt.halves+3);
  addFloater("+1.5♥",0.3,-70,"#7fe09a",15);`,
`  S.consume.tonic--;hurt.halves=Math.min(hurt.max,hurt.halves+3);
  {const mi=B.party.indexOf(hurt);const at=mi>=0?fxAtMember(mi):null;
   if(at)spawnFx("heal",at.x,at.y,{scale:0.9});}
  Sfx.ea("vfx_spells_vfx_new_spirit_fxa_heal_conj_c_imp_n_000",0.7);
  addFloater("+1.5♥",0.3,-70,"#7fe09a",15);`,'tonic fx');

fs.writeFileSync(F,h);
const blocks=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
let bad=0;blocks.forEach((s,i)=>{try{new Function(s)}catch(e){console.log('SYNTAX ERR block',i,e.message);bad++}});
console.log(bad?'FAILED':'ok -',(h.length/1048576).toFixed(1)+'MB,',blocks.length,'blocks');
