/* Pass 13: the original overworld map.
   DMMapScreenSWF parchment, the scroll node markers, the castle — with the
   WORLD_REGIONS.xml node graph. Each track's five study regions ride the
   original road out of the castle (Estate→Pass→Forest→Dales→Sea; the trial
   waits in Orzammar). The map is a lens over the same region/road state —
   it unlocks nothing by itself. */
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
fs.readFileSync('/tmp/dal/map_payload_lit.js','utf8').trim()+`
/* enemy stat medians from the original CHARACTER_CHARCLASS.xml, keyed by foe shape`,'map payload');

/* 2: screen markup, after the keep screen */
rep(`  <div id="title" class="scrn">`,
`  <div id="mapScr" class="scrn hidden">
    <div id="mapFrame">
      <img id="mapBg" alt="The Free Marches">
      <svg id="mapRoads"></svg>
      <div id="mapNodes"></div>
      <button class="btn ghost" id="btnMapClose">Back to the road</button>
    </div>
  </div>

  <div id="title" class="scrn">`,'map markup');

/* 3: styles */
rep(`#bMin:hover{background:#332a4d;color:#fff}`,
`#bMin:hover{background:#332a4d;color:#fff}
#mapScr{display:flex;align-items:center;justify-content:center;background:#120e18}
#mapFrame{position:relative}
#mapBg{display:block;image-rendering:auto;border-radius:6px;box-shadow:0 0 0 1px rgba(150,120,60,.35),0 18px 60px rgba(0,0,0,.75)}
#mapRoads{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}
#mapNodes{position:absolute;left:0;top:0;width:100%;height:100%}
.mapNode{position:absolute;transform:translate(-50%,-92%);background:none;border:none;padding:0;cursor:pointer;text-align:center}
.mapNode img{display:block;margin:0 auto;filter:drop-shadow(0 3px 6px rgba(0,0,0,.55))}
.mapNode.locked{opacity:.45;cursor:default}
.mapNode .mlab{display:block;margin-top:-6px;font:700 11px Georgia,serif;color:#f5e9c8;text-shadow:0 1px 2px #000,0 0 6px rgba(0,0,0,.8);white-space:nowrap}
.mapNode .msub{display:block;font:600 9.5px Georgia,serif;color:#cdb98a;text-shadow:0 1px 2px #000;white-space:nowrap}
.mapNode.cleared .mlab::after{content:" ✓";color:#9fe0b0}
#btnMapClose{position:absolute;left:50%;transform:translateX(-50%);bottom:10px}`,'map styles');

/* 4: the screen logic */
rep(`function travelTo(rid){`,
`/* ---- the original overworld: a lens over region/road state ---- */
/* study regions ride the original road in order; the trial waits in Orzammar */
const MAPBIND={c:["R_T","R_PP","R_PF","R_GD","R_WS"],g:["R_T","R_PP","R_PF","R_GD","R_WS"]};
function mapPlaceOf(rid){
  const order=DATA.regions.filter(r=>r.cert===S.track).map(r=>r.id);
  const i=order.indexOf(rid);
  return i<0?null:DATA.eaWorld.find(w=>w.id===MAPBIND[S.track][i]);
}
function openWorldMap(){
  MODE="map";
  Music.sync();
  Sfx.ea("GoToMap",0.8);
  $("mapScr").classList.remove("hidden");
  const M=DATA.eaWorldMap;
  const bg=$("mapBg");
  bg.src=M.bg.d;
  /* fit inside the viewport, preserving the original 767x615 */
  const fit=Math.min((window.innerWidth-40)/M.bg.w,(window.innerHeight-40)/M.bg.h,1.6);
  bg.style.width=Math.round(M.bg.w*fit)+"px";
  bg.style.height=Math.round(M.bg.h*fit)+"px";
  const regs=DATA.regions.filter(r=>r.cert===S.track);
  const sx=p=>Math.round(p.x*fit),sy=p=>Math.round(p.y*fit);
  /* the road lines, as on the original quest map */
  const roads=[["Castle","R_T"],["R_T","R_PP"],["R_PP","R_PF"],["R_PF","R_GD"],["R_GD","R_WS"],["R_WS","R_OR"]];
  let svg="";
  roads.forEach(([a,b])=>{
    const A=DATA.eaWorld.find(w=>w.id===a),Bw=DATA.eaWorld.find(w=>w.id===b);
    if(A&&Bw)svg+="<line x1='"+sx(A)+"' y1='"+(sy(A)-8)+"' x2='"+sx(Bw)+"' y2='"+(sy(Bw)-8)+"' stroke='#1d1812' stroke-width='2.2' stroke-dasharray='1 0' opacity='0.85'/>";
  });
  const rd=$("mapRoads");
  rd.setAttribute("viewBox","0 0 "+Math.round(M.bg.w*fit)+" "+Math.round(M.bg.h*fit));
  rd.innerHTML=svg;
  /* nodes */
  let html="";
  const cast=DATA.eaWorld.find(w=>w.id==="Castle");
  const ci=Math.round(M.castle.w*0.55*fit);
  html+="<button class='mapNode' data-map='Castle' style='left:"+sx(cast)+"px;top:"+(sy(cast)+10)+"px'>"+
    "<img src='"+M.castle.d+"' width='"+ci+"'>"+
    "<span class='mlab'>The Bastion</span><span class='msub'>"+esc(cast.name)+"</span></button>";
  regs.forEach((r,i)=>{
    const place=DATA.eaWorld.find(w=>w.id===MAPBIND[S.track][i]);
    if(!place)return;
    const unlocked=regionUnlocked(r);
    const st=regState(r.id);
    const ni=Math.round(M.node.w*0.42*fit);
    html+="<button class='mapNode"+(unlocked?"":" locked")+(st.boss?" cleared":"")+"' data-map='"+r.id+"' "+
      "style='left:"+sx(place)+"px;top:"+sy(place)+"px'>"+
      "<img src='"+M.node.d+"' width='"+ni+"'>"+
      "<span class='mlab'>"+esc(place.name)+"</span>"+
      "<span class='msub'>"+esc(r.name)+(unlocked?"":" · sealed (Keep Lv "+r.tier+")")+"</span></button>";
  });
  /* the trial gate at Orzammar */
  const orz=DATA.eaWorld.find(w=>w.id==="R_OR");
  const gOpen=allCleared(S.track);
  const niT=Math.round(M.node.w*0.42*fit);
  html+="<button class='mapNode"+(gOpen?"":" locked")+"' data-map='gauntlet' style='left:"+sx(orz)+"px;top:"+sy(orz)+"px'>"+
    "<img src='"+M.node.d+"' width='"+niT+"'>"+
    "<span class='mlab'>"+esc(orz.name)+"</span><span class='msub'>"+esc(DATA.tracks[S.track].gauntlet)+(gOpen?"":" · fell every regional terror first")+"</span></button>";
  $("mapNodes").innerHTML=html;
  $("mapNodes").querySelectorAll("[data-map]").forEach(b=>{
    b.addEventListener("click",()=>{
      const id=b.dataset.map;
      Sfx.ea("BattleNode",0.8);
      if(id==="Castle"){closeWorldMap();openKeep();return}
      if(id==="gauntlet"){if(allCleared(S.track)){closeWorldMap();tryGauntlet({kind:S.track})}return}
      const r=DATA.regions.find(x=>x.id===id);
      if(!r||!regionUnlocked(r))return;
      closeWorldMap();
      travelTo(id);
    });
  });
}
function closeWorldMap(){
  $("mapScr").classList.add("hidden");
  MODE="world";
  Music.sync();
  refreshHUD();
}
function travelTo(rid){`,'map screen');

/* 5: music knows the map */
rep(`    if(m==="battle")go("combat");
    else if(m==="keep")go("castle");
    else if(m==="world")go("quest");
    else go("castle");`,
`    if(m==="battle")go("combat");
    else if(m==="keep")go("castle");
    else if(m==="world"||m==="map")go("quest");
    else go("castle");`,'map music');

/* 6: a Map button on the HUD and a close binding */
rep(`      <button class="iconbtn" id="btnMenu" aria-label="Menu">☰</button>`,
`      <button class="iconbtn" id="btnMenu" aria-label="Menu">☰</button>
      <button class="iconbtn" id="btnMap" aria-label="Map" title="The Free Marches">🗺</button>`,'map button');

rep(`$("btnMenu").addEventListener("click",()=>{Sfx.unlock();openMenu()});`,
`$("btnMenu").addEventListener("click",()=>{Sfx.unlock();openMenu()});
$("btnMap").addEventListener("click",()=>{Sfx.unlock();if(MODE==="world")openWorldMap()});
$("btnMapClose").addEventListener("click",()=>closeWorldMap());`,'map bindings');

/* 7: leaving other screens closes the map too */
rep(`function toTitle(){
  MODE="title";B=null;
  Music.sync();`,
`function toTitle(){
  MODE="title";B=null;
  Music.sync();
  $("mapScr").classList.add("hidden");`,'title closes map');

/* 8: bridge */
rep(`  spawnFx, burstFx, get FXQ(){return FXQ}, get EAPART(){return EAPART}, get EAPART_PHYS(){return EAPART_PHYS},`,
`  spawnFx, burstFx, get FXQ(){return FXQ}, get EAPART(){return EAPART}, get EAPART_PHYS(){return EAPART_PHYS},
  openWorldMap, closeWorldMap, mapPlaceOf, get MAPBIND(){return MAPBIND},`,'bridge');

fs.writeFileSync(F,h);
const blocks=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
let bad=0;blocks.forEach((s,i)=>{try{new Function(s)}catch(e){console.log('SYNTAX ERR block',i,e.message);bad++}});
console.log(bad?'FAILED':'ok -',(h.length/1048576).toFixed(1)+'MB,',blocks.length,'blocks');
