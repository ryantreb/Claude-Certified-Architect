/* Compose a rig with MULTIPLE skins (armor set + weapon set), verbatim.
   Usage: node compose2.js <config.json>
   config: {rig, out, skins:[{swf, prefix, extra:{placementName: fullSymbolName}}]} */
const fs=require('fs'),cp=require('child_process'),{parse}=require('/tmp/dal/meta.js');
const FFDEC='java -Djava.awt.headless=true -Xmx2g -jar /tmp/ffdec/ffdec.jar';
const cfg=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const tmp='/tmp/dal/compose2_tmp_'+process.pid;fs.mkdirSync(tmp,{recursive:true});
function sh(c){cp.execSync(c,{stdio:['ignore','ignore','inherit']})}

sh(`${FFDEC} -swf2xml ${cfg.rig} ${tmp}/rig.xml`);
let rig=fs.readFileSync(`${tmp}/rig.xml`,'utf8');

function topItems(xml){
  const lines=xml.split('\n');
  const out=[];let cur=null;
  for(const ln of lines){
    if(cur===null){
      if(ln.startsWith('    <item type="')){
        if(/\/>\s*$/.test(ln)){out.push(ln);continue}
        cur=[ln];
      }
    }else{
      cur.push(ln);
      if(ln==='    </item>'){out.push(cur.join('\n'));cur=null}
    }
  }
  return out;
}
const KEEP=/^\s*<item type="Define(?!SceneAndFrameLabelData)/;

/* import every skin with its own id offset; build one merged piece map */
const pieceMap={};   // placementName -> renumbered char id
let frags=[];
cfg.skins.forEach((sk,si)=>{
  const OFF=20000*(si+1);
  sh(`${FFDEC} -swf2xml ${sk.swf} ${tmp}/skin${si}.xml`);
  const skin=fs.readFileSync(`${tmp}/skin${si}.xml`,'utf8');
  const syms=parse(sk.swf).symbols;
  if(sk.prefix)for(const[name,id]of Object.entries(syms))
    if(name.startsWith(sk.prefix+'_'))pieceMap[name.slice(sk.prefix.length+1)]=id+OFF;
  for(const[place,symbol]of Object.entries(sk.extra||{})){
    if(syms[symbol]===undefined)throw new Error('extra symbol missing: '+symbol);
    pieceMap[place]=syms[symbol]+OFF;
  }
  let frag=topItems(skin).filter(t=>KEEP.test(t)).join('\n');
  if(!frag)throw new Error('no defines in '+sk.swf);
  frag=frag.replace(/\b(spriteId|characterId|characterID|shapeId|bitmapId|fontId|fontID)="(\d+)"/g,
    (a,k,n)=>`${k}="${+n+OFF}"`);
  frags.push(frag);
});
if(!Object.keys(pieceMap).length)throw new Error('empty piece map');

const at=rig.search(/    <item type="Define/);
if(at<0)throw new Error('rig has no defines');
rig=rig.slice(0,at)+frags.join('\n')+'\n'+rig.slice(at);

let swapped=0;const seen={};
rig=rig.replace(/<item type="PlaceObject[23]Tag"([^>]*)>/g,(whole,attrs)=>{
  const nm=/ name="([^"]+)"/.exec(attrs);
  if(!nm||!(nm[1] in pieceMap))return whole;
  if(!/ placeFlagHasCharacter="true"/.test(attrs))return whole;
  swapped++;seen[nm[1]]=1;
  return whole.replace(/ characterId="\d+"/,` characterId="${pieceMap[nm[1]]}"`);
});
if(!swapped)throw new Error('no placements retargeted');
fs.writeFileSync(`${tmp}/merged.xml`,rig);
sh(`${FFDEC} -xml2swf ${tmp}/merged.xml ${cfg.out}`);
console.log(`${cfg.out}: ${swapped} placements -> [${Object.keys(seen).sort().join(',')}]`);
