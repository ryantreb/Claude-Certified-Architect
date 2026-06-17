/* Parse SWF: fps + per-DefineSprite frame counts and frame labels (no ffdec). */
const fs=require('fs'),zlib=require('zlib');
function parse(path){
  let raw=fs.readFileSync(path);
  const sig=raw.toString('ascii',0,3);
  let body;
  if(sig==='CWS')body=zlib.inflateSync(raw.subarray(8));
  else if(sig==='FWS')body=raw.subarray(8);
  else throw new Error('bad sig '+path);
  const nbits=body[0]>>3;
  let off=Math.ceil((5+nbits*4)/8);
  const fps=body[off+1]+body[off]/256; off+=4;
  const sprites={},symbols={};
  while(off+2<=body.length){
    const hdr=body.readUInt16LE(off);off+=2;
    const code=hdr>>6;let len=hdr&0x3f;
    if(len===0x3f){len=body.readUInt32LE(off);off+=4}
    if(code===39){ /* DefineSprite */
      const id=body.readUInt16LE(off);
      let p=off+4,frames=0;const labels={};
      while(p+2<=off+len){
        const sh=body.readUInt16LE(p);p+=2;
        const sc=sh>>6;let sl=sh&0x3f;
        if(sl===0x3f){sl=body.readUInt32LE(p);p+=4}
        if(sc===1)frames++;
        else if(sc===43){
          let e=p;while(body[e]!==0)e++;
          labels[body.toString('utf8',p,e)]=frames; /* label fires on this frame (0-based) */
        }
        if(sc===0)break;
        p+=sl;
      }
      sprites[id]={frames,labels};
    }else if(code===76){ /* SymbolClass */
      let p=off;const n=body.readUInt16LE(p);p+=2;
      for(let i=0;i<n;i++){
        const id=body.readUInt16LE(p);p+=2;
        let e=p;while(body[e]!==0)e++;
        symbols[body.toString('utf8',p,e)]=id;p=e+1;
      }
    }
    if(code===0)break;
    off+=len;
  }
  return {fps,sprites,symbols};
}
module.exports={parse};
if(require.main===module){
  const m=parse(process.argv[2]);
  console.log('fps',m.fps);
  for(const[name,id]of Object.entries(m.symbols))
    console.log(name,'id='+id,JSON.stringify(m.sprites[id]||{}));
}
