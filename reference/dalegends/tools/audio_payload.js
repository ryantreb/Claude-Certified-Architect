/* Build DATA.eaSnd (every original sound effect from audio.swf, verbatim) and
   DATA.eaMusic (the original music loops from assets/sounds + deep_roads). */
const fs=require('fs');
const SND='/tmp/dal/sndout';
const MUS='/home/user/Claude-Certified-Architect/reference/dalegends/assets/sounds';

const snd={};
for(const f of fs.readdirSync(SND).sort()){
  if(!f.endsWith('.mp3'))continue;                       // skip the stream wav
  let key=f.replace(/^\d+_/,'').replace(/\.mp3(\.mp3)?$/,'');
  if(key==='deep_roads1_lp')continue;                    // rides with the music
  snd[key]='data:audio/mpeg;base64,'+fs.readFileSync(SND+'/'+f).toString('base64');
}
const mus={};
const loops={castle:'CastleLoop.mp3',party:'ChoosePartyLoop.mp3',combat:'CombatLoop.mp3',quest:'QuestLoop.mp3'};
for(const[k,f]of Object.entries(loops))
  mus[k]='data:audio/mpeg;base64,'+fs.readFileSync(MUS+'/'+f).toString('base64');
const dr=fs.readdirSync(SND).find(f=>f.includes('deep_roads1_lp'));
if(dr)mus.deeproads='data:audio/mpeg;base64,'+fs.readFileSync(SND+'/'+dr).toString('base64');

const out='/* the original sound library (audio.swf) and music loops (assets/sounds), verbatim */\n'+
  'DATA.eaSnd='+JSON.stringify(snd)+';\n'+
  'DATA.eaMusic='+JSON.stringify(mus)+';\n';
fs.writeFileSync('/tmp/dal/audio_payload_lit.js',out);
console.log('sfx:',Object.keys(snd).length,'music:',Object.keys(mus).length,
  'payload',(out.length/1048576).toFixed(1)+'MB');
