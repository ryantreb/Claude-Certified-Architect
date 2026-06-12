/* Pass 17: the road walks every page of the original quest maps.
   DATA.eaMap becomes campaign-keyed page sets (PP/PF/GD/WS/OR + WC for the
   Crossweave). Each region's road anchors onto its CURRENT page — wins and
   the felled boss turn pages (state 0..4 mapped across the set) — and the
   hero walks the original LevelSet waypoints of that page. Orzammar pages
   bring the deep-roads loop. Rendering and music read state; they never
   write it. */
const fs=require('fs');
const F='/home/user/Claude-Certified-Architect/index.html';
let h=fs.readFileSync(F,'utf8');
function rep(a,b,tag){
  const i=h.indexOf(a);
  if(i<0)throw new Error('anchor missing: '+tag);
  if(h.indexOf(a,i+1)>=0)throw new Error('anchor not unique: '+tag);
  h=h.slice(0,i)+b+h.slice(i+a.length);
}

/* 1: swap the payload line (old per-track arrays -> keyed page sets) */
{
  const start=h.indexOf('DATA.eaMap={"c":[{"set":"L_GD_1"');
  if(start<0)throw new Error('old eaMap payload missing');
  const end=h.indexOf('\n',start)+1;
  h=h.slice(0,start)+fs.readFileSync('/tmp/dal/eamap2_payload.js','utf8').trim()+'\n'+h.slice(end);
}

/* 2: image cache by set key */
rep(`const EAMAPIMG={c:[],g:[]};
try{for(const tr of ["c","g"])(DATA.eaMap&&DATA.eaMap[tr]||[]).forEach(function(m,i){
  const im=new Image();im.decoding="async";im.src=m.d;EAMAPIMG[tr][i]=im;});}catch(e){}`,
`const EAMAPIMG={};
try{for(const key of Object.keys(DATA.eaMap||{})){
  EAMAPIMG[key]=DATA.eaMap[key].map(function(m){
    const im=new Image();im.decoding="async";im.src=m.d;return im;});
}}catch(e){}`,'img cache');

/* 3: page resolution + the rewritten layout */
rep(`/* anchor every road node on its act's map along the original trail */
function layoutRoads(){
  for(const tr of ["c","g"]){
    const N=ROADS[tr],maps=DATA.eaMap&&DATA.eaMap[tr];
    if(!N||!maps||!maps.length)continue;
    const groups=[];let cur=null;
    for(const n of N){
      if(n.kind==="bastion"){groups.push(cur={list:[n]});continue}
      if(n.kind==="trial"){cur.list.push(n);continue}
      if(cur&&cur.rid===n.region.id){cur.list.push(n);continue}
      if(groups.length===1&&groups[0].rid===undefined&&groups[0].list.length===1){
        cur=groups[0];cur.rid=n.region.id;cur.list.push(n);   /* act 1 shares the bastion map */
      }else groups.push(cur={rid:n.region.id,list:[n]});
    }
    groups.forEach(function(g,gi){
      const mi=Math.min(gi,maps.length-1),pts=DATA.eaMap[tr][mi].pts,K=g.list.length;
      g.list.forEach(function(n,j){
        const pi=K<2?0:Math.round(j*(pts.length-1)/(K-1));
        n.mp={mi,pi,px:pts[pi][0],py:pts[pi][1]};
      });
    });
  }
}`,
`/* which page of which original set a region's road shows right now:
   the campaign chain (QUESTBIND) names the set; wins 0-3 and the felled
   boss map onto its pages (state 0..4 spread across the set). Crossweave
   rides the Waking Coves. Read-only. */
function regionRoadPage(tr,rid){
  if(!DATA.eaMap)return null;
  const reg=DATA.regions.find(function(x){return x.id===rid});
  let key;
  if(reg&&reg.cert==="x")key="WC";
  else{
    const order=DATA.regions.filter(function(x){return x.cert===tr}).map(function(x){return x.id});
    key=QUESTBIND[order.indexOf(rid)];
  }
  const pages=DATA.eaMap[key];
  if(!pages||!pages.length)return null;
  const st=(S.regions&&S.regions[rid])||{wins:0,boss:false};
  const state=st.boss?4:Math.min(3,st.wins||0);
  return {key,page:Math.round(state/4*(pages.length-1))};
}
/* anchor every road node on its region's CURRENT page along the original trail */
function layoutRoads(){
  for(const tr of ["c","g"]){
    const N=ROADS[tr];
    if(!N||!DATA.eaMap)continue;
    const groups=[];let cur=null;
    for(const n of N){
      if(n.kind==="bastion"){groups.push(cur={list:[n]});continue}
      if(n.kind==="trial"){cur.list.push(n);continue}
      if(cur&&cur.rid===n.region.id){cur.list.push(n);continue}
      if(groups.length===1&&groups[0].rid===undefined&&groups[0].list.length===1){
        cur=groups[0];cur.rid=n.region.id;cur.list.push(n);   /* act 1 shares the bastion map */
      }else groups.push(cur={rid:n.region.id,list:[n]});
    }
    groups.forEach(function(g){
      const pg=(g.rid&&regionRoadPage(tr,g.rid))||{key:"PP",page:0};
      const pages=DATA.eaMap[pg.key]||DATA.eaMap.PP;
      const m=pages[Math.min(pg.page,pages.length-1)];
      const pts=m.pts,K=g.list.length;
      g.list.forEach(function(n,j){
        const pi=K<2?0:Math.round(j*(pts.length-1)/(K-1));
        n.mp={key:pg.key,page:pg.page,pi,px:pts[pi][0],py:pts[pi][1]};
      });
    });
  }
}`,'layout');

/* 4: hero interpolation and the camera follow the keyed pages */
rep(`  if(A.mi!==B.mi)return f<0.5?A:B;
  const m=DATA.eaMap[S.track][A.mi];
  const tt=A.pi+(B.pi-A.pi)*f;
  const k=clamp(Math.floor(tt),0,m.pts.length-1),r=tt-k;
  const p=m.pts[k],q=m.pts[clamp(k+1,0,m.pts.length-1)];
  return {mi:A.mi,px:p[0]+(q[0]-p[0])*r,py:p[1]+(q[1]-p[1])*r};
}`,
`  if(A.key!==B.key||A.page!==B.page)return f<0.5?A:B;
  const m=DATA.eaMap[A.key][A.page];
  const tt=A.pi+(B.pi-A.pi)*f;
  const k=clamp(Math.floor(tt),0,m.pts.length-1),r=tt-k;
  const p=m.pts[k],q=m.pts[clamp(k+1,0,m.pts.length-1)];
  return {key:A.key,page:A.page,px:p[0]+(q[0]-p[0])*r,py:p[1]+(q[1]-p[1])*r};
}`,'heroMP');

rep(`  const m=DATA.eaMap[S.track][hp.mi],img=EAMAPIMG[S.track][hp.mi];`,
`  const m=DATA.eaMap[hp.key][hp.page],img=EAMAPIMG[hp.key]&&EAMAPIMG[hp.key][hp.page];`,'mapCam');

rep(`  const n=roadNodes()[i];if(!n||!n.mp||n.mp.mi!==C.hp.mi)return null;`,
`  const n=roadNodes()[i];if(!n||!n.mp||n.mp.key!==C.hp.key||n.mp.page!==C.hp.page)return null;`,'nodeScreenXY');

/* 5: pages turn when battles end */
rep(`function endBattleUI(){
  B=null;MODE="world";
  Music.sync();`,
`function endBattleUI(){
  B=null;MODE="world";
  if(typeof layoutRoads==="function")layoutRoads();   /* quest pages may have turned */
  Music.sync();`,'page turn');

/* 6: the deep roads sing under Orzammar pages */
rep(`    if(m==="battle")go("combat");
    else if(m==="keep")go("castle");
    else if(m==="world"||m==="map")go("quest");
    else go("castle");`,
`    if(m==="battle")go("combat");
    else if(m==="keep")go("castle");
    else if(m==="world"||m==="map")go((typeof worldLoop==="function")?worldLoop():"quest");
    else go("castle");`,'music pick');

rep(`/* hero position along the original waypoints between two node anchors */`,
`/* the loop under the hero's feet: Orzammar pages sing the deep roads */
function worldLoop(){
  try{
    const N=roadNodes();if(!N.length)return "quest";
    const i=clamp(Math.round(RD.x),0,N.length-1);
    const mp=N[i]&&N[i].mp;
    return (mp&&mp.key==="OR")?"deeproads":"quest";
  }catch(e){return "quest"}
}
/* hero position along the original waypoints between two node anchors */`,'worldLoop');

/* 7: arrivals re-pick the loop */
rep(`  const b=$("regionBanner");b.classList.add("show");
  if(bannerTimer)clearTimeout(bannerTimer);`,
`  const b=$("regionBanner");b.classList.add("show");
  Music.sync();
  if(bannerTimer)clearTimeout(bannerTimer);`,'banner music');

/* 8: bridge */
rep(`  questChainOf, regionQuestNow, currentQuest, get QUESTBIND(){return QUESTBIND},`,
`  questChainOf, regionQuestNow, currentQuest, get QUESTBIND(){return QUESTBIND},
  regionRoadPage, worldLoop, layoutRoads, heroMP,`,'bridge');

fs.writeFileSync(F,h);
const blocks=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
let bad=0;blocks.forEach((s,i)=>{try{new Function(s)}catch(e){console.log('SYNTAX ERR block',i,e.message);bad++}});
console.log(bad?'FAILED':'ok -',(h.length/1048576).toFixed(1)+'MB,',blocks.length,'blocks');
