/* Slice the original female head (skin + hair, preset 1: SkinType 1, hair 2)
   out of DALFlashApp.swf into a tiny standalone skin SWF whose single symbol
   `hfHead_head` composes hair_back + headSkin + hair — ready for compose2 to
   attach onto the rigs' `head` placement. All art verbatim. */
const fs=require('fs');
const cp=require('child_process');
const FFDEC='java -Djava.awt.headless=true -Xmx3g -jar /tmp/ffdec/ffdec.jar';
const xml=fs.readFileSync('/tmp/dal/app.xml','utf8');

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
const want=['hf_headSkin','hf_hair_2','hf_hair_2_back'];
for(const w of want)if(sym[w]===undefined)throw new Error('symbol missing: '+w);
console.log(want.map(w=>w+'='+sym[w]).join(' '));

/* defines indexed by own id (first id-ish attr on the opening line) */
const own={};
for(const it of items){
  if(!/^    <item type="Define/.test(it))continue;
  const first=it.split('\n')[0];
  const m=/(?:spriteId|shapeId|characterID|characterId|bitmapId|fontId)="(\d+)"/.exec(first);
  if(m)own[+m[1]]=it;
}

/* dependency closure from the wanted symbols */
const need=new Set(),queue=want.map(w=>sym[w]);
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
      /* same number as own id on the first line — still a real dep if it appears past line 1 */
      const body=it.slice(it.indexOf('\n'));
      if(body.includes('"'+rid+'"'))queue.push(rid);
    }
  }
}
console.log('defines needed:',need.size);

/* keep original ids (they live alone in this little SWF); wrapper takes a free id */
const maxId=Math.max(...need);
const WRAP=maxId+1;
const defs=[...need].sort((a,b)=>a-b).map(id=>own[id]).join('\n');
const place=(id,depth)=>`        <item type="PlaceObject2Tag" characterId="${id}" depth="${depth}" forceWriteAsLong="false" placeFlagHasCharacter="true" placeFlagHasClipActions="false" placeFlagHasClipDepth="false" placeFlagHasColorTransform="false" placeFlagHasMatrix="true" placeFlagHasName="false" placeFlagHasRatio="false" placeFlagMove="false">
          <matrix type="MATRIX" hasRotate="false" hasScale="false" nRotateBits="0" nScaleBits="0" nTranslateBits="1" translateX="0" translateY="0"/>
        </item>`;
const wrapper=`    <item type="DefineSpriteTag" forceWriteAsLong="false" frameCount="1" hasEndTag="true" spriteId="${WRAP}">
      <subTags>
${place(sym['hf_hair_2_back'],1)}
${place(sym['hf_headSkin'],2)}
${place(sym['hf_hair_2'],3)}
        <item type="ShowFrameTag" forceWriteAsLong="false"/>
      </subTags>
    </item>`;
/* an empty sprite blanks the helmet slots (bare-headed starters) */
const EMPTY=WRAP+1;
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
fs.writeFileSync('/tmp/dal/hfHead.xml',out);
cp.execSync(`${FFDEC} -xml2swf /tmp/dal/hfHead.xml /tmp/dal/composedHero/hfHeadSkin.swf`,{stdio:['ignore','inherit','inherit']});
console.log('hfHeadSkin.swf written');
