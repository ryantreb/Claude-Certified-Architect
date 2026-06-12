/* Compose a DA Legends rig with its skin, verbatim:
   import the skin's piece symbols into the rig SWF (via ffdec XML) and retarget
   every named piece placement (name="shinR" etc) to the skin art <prefix>_<piece>.
   Usage: node compose.js <rig.swf> <skin.swf> <prefix> <out.swf> */
const fs=require('fs'),cp=require('child_process'),{parse}=require('/tmp/dal/meta.js');
const FFDEC='java -Djava.awt.headless=true -Xmx2g -jar /tmp/ffdec/ffdec.jar';
const OFF=20000;
const [rigSwf,skinSwf,prefix,outSwf]=process.argv.slice(2);
const tmp='/tmp/dal/compose_tmp';fs.mkdirSync(tmp,{recursive:true});

function sh(c){cp.execSync(c,{stdio:['ignore','ignore','inherit']})}
sh(`${FFDEC} -swf2xml ${rigSwf} ${tmp}/rig.xml`);
sh(`${FFDEC} -swf2xml ${skinSwf} ${tmp}/skin.xml`);
let rig=fs.readFileSync(`${tmp}/rig.xml`,'utf8');
const skin=fs.readFileSync(`${tmp}/skin.xml`,'utf8');

/* piece map from the skin binary: pieceName -> symbol char id */
const pieces={};
for(const[name,id]of Object.entries(parse(skinSwf).symbols))
  if(name.startsWith(prefix+'_'))pieces[name.slice(prefix.length+1)]=id;
if(!Object.keys(pieces).length)throw new Error('no pieces for prefix '+prefix);

/* ffdec pretty-prints: top-level tag items sit at exactly 4-space indent */
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
const defs=topItems(skin).filter(t=>KEEP.test(t));
if(!defs.length)throw new Error('no defines extracted');
/* renumber ids inside the imported fragment */
let frag=defs.join('\n');
frag=frag.replace(/\b(spriteId|characterId|characterID|shapeId|bitmapId|fontId|fontID)="(\d+)"/g,
  (a,k,n)=>`${k}="${+n+OFF}"`);

/* ---- splice into the rig before its first Define tag ---- */
const at=rig.search(/    <item type="Define/);
if(at<0)throw new Error('rig has no defines');
rig=rig.slice(0,at)+frag+'\n'+rig.slice(at);

/* ---- retarget named piece placements ---- */
let swapped=0;const seen={};
rig=rig.replace(/<item type="PlaceObject[23]Tag"([^>]*)>/g,(whole,attrs)=>{
  const nm=/ name="([^"]+)"/.exec(attrs);
  if(!nm||!(nm[1] in pieces))return whole;
  if(!/ placeFlagHasCharacter="true"/.test(attrs))return whole;
  const id=pieces[nm[1]]+OFF;
  swapped++;seen[nm[1]]=1;
  return whole.replace(/ characterId="\d+"/,` characterId="${id}"`);
});
if(!swapped)throw new Error('no placements retargeted');
fs.writeFileSync(`${tmp}/merged.xml`,rig);
sh(`${FFDEC} -xml2swf ${tmp}/merged.xml ${outSwf}`);
console.log(`${outSwf}: ${swapped} placements -> ${Object.keys(seen).length} pieces (${Object.keys(pieces).length} available)`);
