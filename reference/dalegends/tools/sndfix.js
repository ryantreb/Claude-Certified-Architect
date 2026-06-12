/* Audio hardening: persistent gesture unlock, resume on tab focus, old-save
   settings migration, sample warmup, and a Settings sound test. */
const fs=require('fs');
const F='/home/user/Claude-Certified-Architect/index.html';
let h=fs.readFileSync(F,'utf8');
function rep(a,b,tag){
  const i=h.indexOf(a);
  if(i<0)throw new Error('anchor missing: '+tag);
  if(h.indexOf(a,i+1)>=0)throw new Error('anchor not unique: '+tag);
  h=h.slice(0,i)+b+h.slice(i+a.length);
}

/* 1: unlock keeps trying until the engine is truly awake, then warms samples */
rep(`window.addEventListener("pointerdown",()=>Sfx.unlock(),{once:true});`,
`/* keep unlocking on every gesture until the context runs and the music
   plays (or is off) — one wasted first click must not mean silence */
(function(){
  let warmed=false;
  function awake(){
    try{
      Sfx.unlock();
      if(!warmed&&S&&S.settings.sound&&DATA.eaSnd){
        warmed=true;
        ["ButtonPress_1","Slash","da_gui_hit1","Victory","Oops","combat_start_B"]
          .forEach(n=>{try{Sfx.warm(n)}catch(e){}});
      }
    }catch(e){}
    if(Sfx.running()&&(Music.playing()||(S&&S.settings.music===false))){
      window.removeEventListener("pointerdown",awake);
      window.removeEventListener("keydown",awake);
      window.removeEventListener("touchend",awake);
    }
  }
  window.addEventListener("pointerdown",awake);
  window.addEventListener("keydown",awake);
  window.addEventListener("touchend",awake);
})();
window.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="visible"){try{Sfx.unlock()}catch(e){}}
});`,'persistent unlock');

/* 2: Sfx grows warm() and running() */
rep(`  return {play,unlock,ea};
})();`,
`  /* decode a sample ahead of need (first strike should not be silent) */
  function warm(name){
    if(!DATA.eaSnd||!DATA.eaSnd[name]||bank[name]||loading[name])return;
    if(!sEnsure())return;
    loading[name]=1;
    fetch(DATA.eaSnd[name]).then(r=>r.arrayBuffer()).then(ab=>ctx.decodeAudioData(ab))
      .then(b=>{bank[name]=b}).catch(()=>{});
  }
  function running(){return !!(ctx&&ctx.state==="running")}
  return {play,unlock,ea,warm,running};
})();`,'sfx warm');

/* 3: Music grows playing() */
rep(`  return {go,stop,sync,get cur(){return cur}};
})();`,
`  function playing(){return !!(el&&!el.paused&&el.currentTime>0)}
  return {go,stop,sync,playing,get cur(){return cur}};
})();`,'music playing');

/* 4: old saves take the music key explicitly (toggle shows the truth) */
rep(`  const d=load();
  if(!d){toast("The save could not be read.");return}
  S=d;startGame(false);`,
`  const d=load();
  if(!d){toast("The save could not be read.");return}
  if(d.settings&&d.settings.music===undefined)d.settings.music=true;
  if(d.settings&&d.settings.sound===undefined)d.settings.sound=true;
  S=d;startGame(false);`,'save migrate');

/* 5: a sound test in Settings — plays both engines and reports state */
rep(`function openSettingsModal(){
  showModal("<h2 class='serif'>Settings</h2><div id='setBox'>"+settingsRows()+"</div>",
    [{label:"Done",cls:"primary"}]);`,
`function openSettingsModal(){
  showModal("<h2 class='serif'>Settings</h2><div id='setBox'>"+settingsRows()+"</div>"+
    "<button class='btn ghost wfull' id='btnSndTest' style='margin-top:8px'>Test the sound</button>",
    [{label:"Done",cls:"primary"}]);
  const t=$("btnSndTest");
  if(t)t.addEventListener("click",()=>{
    Sfx.unlock();
    Sfx.ea("Victory",0.9);
    Sfx.play("levelup");
    Music.sync();
    setTimeout(()=>{
      const lines=[];
      lines.push(S.settings.sound?"Effects: ON":"Effects: OFF (toggle above)");
      lines.push(S.settings.music===false?"Music: OFF (toggle above)":"Music: "+(Music.playing()?"playing — "+Music.cur:"not playing yet — click anywhere once more"));
      lines.push("Engine: "+(Sfx.running()?"running":"blocked — the browser wants another click"));
      toast(lines.join("  ·  "),true);
    },350);
  });`,'sound test');

fs.writeFileSync(F,h);
const blocks=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
let bad=0;blocks.forEach((s,i)=>{try{new Function(s)}catch(e){console.log('SYNTAX ERR block',i,e.message);bad++}});
console.log(bad?'FAILED':'ok -',(h.length/1048576).toFixed(1)+'MB,',blocks.length,'blocks');
