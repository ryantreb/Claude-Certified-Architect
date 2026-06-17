/* Slice the four original creation-hall preset heads out of DALFlashApp.swf,
   one standalone skin SWF per hero, composed EXACTLY as the game's
   CompositeHead.as assembles them: hair_back -> headSkin -> eyes -> hair
   (-> headband as hair child) -> elf ears, with the original skinColors/
   hairColors tint tables applied as setTint(color, fraction) transforms.
   Presets are rows of CHARACTER_PRESET.xml; hairType->symbol maps are the
   originals' switch tables (NOT identity). All art and numbers verbatim. */
const fs=require('fs');
const cp=require('child_process');
const FFDEC='java -Djava.awt.headless=true -Xmx3g -jar /tmp/ffdec/ffdec.jar';
const xml=fs.readFileSync('/tmp/dal/app.xml','utf8');

/* CompositeHead.as tint tables, verbatim (HeadTint(color, fraction)) */
const HAIR=[[0,.5],[5915442,.5],[15585637,.5],[3751505,.5],[10374456,.5],
            [14640941,.5],[13092807,.5],[7097197,.5],[11372869,.5],[0,0]];
const SKIN=[[16441285,.5],[16240275,.5],[13668706,.5],[15708306,.5],[12548926,.5],
            [7424821,.5],[16577504,.5],[4862756,.5],[3090212,.5],[0,0]];

/* The four heroes = four CHARACTER_PRESET.xml rows fed through the original
   build{Race}{Gender} switch tables:
   War: Male preset 1   (Skin 1, SkinColor 4, HairColor 0, HairType 2)  human male
   Rog: Female preset 4 (Skin 1, SkinColor 5, HairColor 2, HairType 7)  human female
   Mag: Male preset 2   (Skin 2, SkinColor 3, HairColor 1, HairType 11) elf male
        (elf male skinType 2 = em_headband riding the hair, hair-tinted)
   Arc: Female preset 3 (Skin 4, SkinColor 6, HairColor 4, HairType 3)  elf female
        (elf female: single ef_headSkin; hairType 3 -> hf_hair_3 per its table) */
const HEROES={
  headWar:[
    {sym:'hm_headSkin',tint:SKIN[4]},
    {sym:'hm_eyes'},
    {sym:'hm_hair_2',tint:HAIR[0]}],
  headRog:[
    {sym:'hf_hair_7_back',tint:HAIR[2]},
    {sym:'hf_headSkin',tint:SKIN[5]},
    {sym:'hf_eyes'},
    {sym:'hf_hair_7',tint:HAIR[2]}],
  headMag:[
    {sym:'em_headSkin',tint:SKIN[3]},
    {sym:'em_eyes'},
    {sym:'em_hair_11',tint:HAIR[1]},
    {sym:'em_headband',tint:HAIR[1]},
    {sym:'em_ears',tint:SKIN[3]}],
  headArc:[
    {sym:'ef_headSkin',tint:SKIN[6]},
    {sym:'ef_eyes'},
    {sym:'hf_hair_3',tint:HAIR[4]},
    {sym:'ef_ear',tint:SKIN[6]}],
};

function topItems(x){
  const lines=x.split('\n');
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
const items=topItems(xml);
console.log('top items:',items.length);

/* symbol table: name -> id */
const sym={};
for(const it of items){
  if(!it.includes('type="SymbolClassTag"'))continue;
  const tags=[...it.matchAll(/<item>(\d+)<\/item>/g)].map(m=>+m[1]);
  const names=[...it.matchAll(/<item>([^<\d][^<]*)<\/item>/g)].map(m=>m[1]);
  for(let i=0;i<Math.min(tags.length,names.length);i++)sym[names[i]]=tags[i];
}
for(const layers of Object.values(HEROES))
  for(const l of layers)if(sym[l.sym]===undefined)throw new Error('symbol missing: '+l.sym);

/* defines indexed by own id (first id-ish attr on the opening line) */
const own={};
for(const it of items){
  if(!/^    <item type="Define/.test(it))continue;
  const first=it.split('\n')[0];
  const m=/(?:spriteId|shapeId|characterID|characterId|bitmapId|fontId)="(\d+)"/.exec(first);
  if(m)own[+m[1]]=it;
}

/* dependency closure walker (same approach the first headskin build proved) */
function closure(roots){
  const need=new Set(),queue=[...roots];
  while(queue.length){
    const id=queue.pop();
    if(need.has(id))continue;
    const it=own[id];
    if(!it){console.log('WARN no define for',id);continue}
    need.add(id);
    const first=it.split('\n')[0];
    for(const m of it.matchAll(/\b(?:characterId|characterID|bitmapId|fontId)="(\d+)"/g)){
      const rid=+m[1];
      if(!need.has(rid)&&own[rid]&&!first.includes('"'+rid+'"'))queue.push(rid);
      else if(own[rid]&&!need.has(rid)){
        const body=it.slice(it.indexOf('\n'));
        if(body.includes('"'+rid+'"'))queue.push(rid);
      }
    }
  }
  return need;
}

/* setTint(color, fraction): mult=(1-f)*256, add=round(channel*f); alpha rides */
function cxform(t){
  const[c,f]=t;
  const mul=Math.round((1-f)*256);
  const r=Math.round(((c>>16)&255)*f),g=Math.round(((c>>8)&255)*f),b=Math.round((c&255)*f);
  return `<colorTransform type="CXFORMWITHALPHA" alphaAddTerm="0" alphaMultTerm="256" blueAddTerm="${b}" blueMultTerm="${mul}" greenAddTerm="${g}" greenMultTerm="${mul}" hasAddTerms="true" hasMultTerms="true" nbits="10" redAddTerm="${r}" redMultTerm="${mul}"/>`;
}
function place(id,depth,tint){
  const hasCx=!!(tint&&tint[1]>0);
  return `        <item type="PlaceObject2Tag" characterId="${id}" depth="${depth}" forceWriteAsLong="false" placeFlagHasCharacter="true" placeFlagHasClipActions="false" placeFlagHasClipDepth="false" placeFlagHasColorTransform="${hasCx}" placeFlagHasMatrix="true" placeFlagHasName="false" placeFlagHasRatio="false" placeFlagMove="false">
          <matrix type="MATRIX" hasRotate="false" hasScale="false" nRotateBits="0" nScaleBits="0" nTranslateBits="1" translateX="0" translateY="0"/>
${hasCx?'          '+cxform(tint)+'\n':''}        </item>`;
}

for(const[key,layers]of Object.entries(HEROES)){
  const roots=[...new Set(layers.map(l=>sym[l.sym]))];
  const need=closure(roots);
  /* compact renumber 1..N (compose2's id-offset regex set, proven on these defines) */
  const sorted=[...need].sort((a,b)=>a-b);
  const map={};sorted.forEach((id,i)=>map[id]=i+1);
  const defs=sorted.map(id=>own[id].replace(
    /\b(spriteId|characterId|characterID|shapeId|bitmapId|fontId|fontID)="(\d+)"/g,
    (a,k,n)=>map[+n]!==undefined?`${k}="${map[+n]}"`:a)).join('\n');
  const WRAP=sorted.length+1,EMPTY=WRAP+1;
  const wrapper=`    <item type="DefineSpriteTag" forceWriteAsLong="false" frameCount="1" hasEndTag="true" spriteId="${WRAP}">
      <subTags>
${layers.map((l,i)=>place(map[sym[l.sym]],i+1,l.tint)).join('\n')}
        <item type="ShowFrameTag" forceWriteAsLong="false"/>
      </subTags>
    </item>`;
  const emptySprite=`    <item type="DefineSpriteTag" forceWriteAsLong="false" frameCount="1" hasEndTag="true" spriteId="${EMPTY}">
      <subTags>
        <item type="ShowFrameTag" forceWriteAsLong="false"/>
      </subTags>
    </item>`;
  const symbolClass=`    <item type="SymbolClassTag" forceWriteAsLong="true">
      <tags>
        <item>${WRAP}</item>
        <item>${EMPTY}</item>
        <item>${EMPTY}</item>
      </tags>
      <names>
        <item>hfHead_head</item>
        <item>hfHead_helmet</item>
        <item>hfHead_helmetBack</item>
      </names>
    </item>`;
  const out=`<?xml version="1.0" encoding="UTF-8"?><swf _xmlExportMajor="2" _xmlExportMinor="2" _generator="JPEXS Free Flash Decompiler v.26.2.1" type="SWF" charset="UTF-8" compression="ZLIB" encrypted="false" frameCount="1" frameRate="25.0" gfx="false" hasEndTag="true" version="9">
  <displayRect type="RECT" Xmax="40000" Xmin="0" Ymax="20000" Ymin="0" nbits="17"/>
  <tags>
${defs}
${wrapper}
${emptySprite}
${symbolClass}
    <item type="ShowFrameTag" forceWriteAsLong="false"/>
  </tags>
</swf>`;
  fs.writeFileSync(`/tmp/dal/${key}.xml`,out);
  cp.execSync(`${FFDEC} -xml2swf /tmp/dal/${key}.xml /tmp/dal/composedHero/${key}.swf`,{stdio:['ignore','inherit','inherit']});
  console.log(key,'->',sorted.length,'defines, wrap id',WRAP);
}
console.log('done');
