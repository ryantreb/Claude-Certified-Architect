const fs=require('fs'),zlib=require('zlib');
function symbols(path){
  let raw=fs.readFileSync(path);
  const sig=raw.toString('ascii',0,3);
  let body;
  if(sig==='CWS')body=zlib.inflateSync(raw.subarray(8));
  else if(sig==='FWS')body=raw.subarray(8);
  else throw new Error('unsupported sig '+sig+' in '+path);
  /* skip RECT (frame size), then u16 frameRate, u16 frameCount */
  const nbits=body[0]>>3;
  let off=Math.ceil((5+nbits*4)/8)+4;
  const out=[];
  while(off+2<=body.length){
    const hdr=body.readUInt16LE(off);off+=2;
    const code=hdr>>6;let len=hdr&0x3f;
    if(len===0x3f){len=body.readUInt32LE(off);off+=4}
    if(code===76){ /* SymbolClass */
      let p=off;const n=body.readUInt16LE(p);p+=2;
      for(let i=0;i<n;i++){
        const id=body.readUInt16LE(p);p+=2;
        let e=p;while(body[e]!==0)e++;
        out.push([id,body.toString('utf8',p,e)]);p=e+1;
      }
    }
    if(code===0)break;
    off+=len;
  }
  return out;
}
for(const f of process.argv.slice(2))
  for(const [id,name] of symbols(f))console.log(id+'\t'+name+'\t'+f.split('/').pop());
