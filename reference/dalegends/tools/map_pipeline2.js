/* Quest-map payload v2: page sets keyed by campaign chain (QUESTBIND), every
   page of the five bound sets plus Waking Coves for the Crossweave. Each page
   carries the original painted map and the LevelSet node trail (MapX/MapY in
   map pixels) ordered into a walkable chain. */
const fs=require('fs');
const sharp=require('/tmp/dal/npm/node_modules/sharp');
const ROOT='/home/user/Claude-Certified-Architect/reference/dalegends';
const SETS={PP:5,PF:7,GD:6,WS:7,OR:7,WC:5};
const xml=fs.readFileSync(ROOT+'/data/ENCOUNTER_LEVELSETS.xml','utf8');
const sets={};
for(const s of xml.split('<LevelSet>').slice(1)){
  const id=(s.match(/<ID>([^<]+)/)||[])[1];
  const bg=(s.match(/<BackgroundImage>([^<]*)/)||[])[1];
  const locs=[];
  for(const L of s.split('<Location>').slice(1)){
    const g=t=>{const m=L.match(new RegExp('<'+t+'>([^<]*)'));return m?m[1]:''};
    const conns=[...L.matchAll(/<Connection>([^<]+)/g)].map(m=>m[1]);
    locs.push({id:g('ID'),x:+g('MapX'),y:+g('MapY'),conns});
  }
  if(id)sets[id]={id,bg,locs};
}
function chain(locs){
  const byId={};locs.forEach(l=>byId[l.id]=l);
  const adj={};locs.forEach(l=>adj[l.id]=new Set());
  for(const l of locs)for(const c of l.conns||[])
    if(byId[c]){adj[l.id].add(c);adj[c].add(l.id)}
  const start=locs[0].id;
  const par={[start]:null},order=[start];
  for(let q=0;q<order.length;q++)
    for(const n of adj[order[q]])if(!(n in par)){par[n]=order[q];order.push(n)}
  let far=order[order.length-1];
  const path=[];for(let n=far;n;n=par[n])path.push(byId[n]);
  path.reverse();
  return path.map(l=>[Math.round(l.x),Math.round(l.y)]);
}
(async()=>{
  const out={};
  for(const[key,nPages]of Object.entries(SETS)){
    out[key]=[];
    for(let p=1;p<=nPages;p++){
      const id='L_'+key+'_'+p;
      const st=sets[id];if(!st)throw new Error('no set '+id);
      const jpg=`${ROOT}/maps/${st.bg}.jpg`;
      const meta=await sharp(jpg).metadata();
      const b=await sharp(jpg).webp({quality:68}).toBuffer();
      out[key].push({set:id,w:meta.width,h:meta.height,
        pts:chain(st.locs),
        d:'data:image/webp;base64,'+b.toString('base64')});
      console.log(key,id,st.bg,meta.width+'x'+meta.height,(b.length/1024|0)+'KB');
    }
  }
  fs.writeFileSync('/tmp/dal/eamap2_payload.js',
    '/* the original quest maps, every page of the campaign-bound sets (the road walks them;\n   pages turn with quest progress) */\nDATA.eaMap='+JSON.stringify(out)+';\n');
  console.log('map payload v2',(fs.statSync('/tmp/dal/eamap2_payload.js').size/1048576).toFixed(2)+'MB');
})().catch(e=>{console.error(e);process.exit(1)});
