/* DATA.eaComp: the original guild companions (CHARACTER_GUILDNPCS.xml,
   CanUseInBattle=TRUE), verbatim stats/warcries/portraits. The duplicate
   tutorial row is dropped; classes map onto the four disciplines (rogues
   with bows ride as rangers; Barkspawn hunts as a shadow; the Drake casts
   flame; Shale holds the line). */
const fs=require('fs');
const ICONS='/home/user/Claude-Certified-Architect/reference/dalegends/assets/npc_icons';
const sharp=require('/tmp/dal/npm/node_modules/sharp');

const ROWS=[ /* extracted from CHARACTER_GUILDNPCS.xml */
 {id:"NPC_JANARA",cls:"vanguard",name:"Janara",race:"Human",warcry:"Natural 20!",icon:"Janara.png",atk:10,df:13,agi:8,hp:8,skill:"Quick Lunge",joins:{t:"boss",i:0}},
 {id:"NPC_SENDIS",cls:"shadow",name:"Sendis",race:"Human",warcry:"I am Sendis!",icon:"Sendis.png",atk:8,df:10,agi:14,hp:14,skill:"Combat Training",joins:{t:"boss",i:1}},
 {id:"NPC_CERLAIS",cls:"caster",name:"Cerlais",race:"Human",warcry:"So easy an NPC can do it!",icon:"Cerlais.png",atk:12,df:7,agi:10,hp:6,skill:"Heal",joins:{t:"boss",i:2}},
 {id:"NPC_ANTOR",cls:"ranger",name:"Antor",race:"Human",warcry:"That stain will take forever to get out!",icon:"Antor.png",atk:9,df:10,agi:16,hp:8,skill:"Piercing Shot",joins:{t:"boss",i:3}},
 {id:"NPC_LUKESH",cls:"caster",name:"Lukesh",race:"Human",warcry:"I am Lukesh! Fear me!",icon:"Lukesh.png",atk:20,df:8,agi:12,hp:12,skill:"Staff Mastery",joins:{t:"boss",i:4}},
 {id:"NPC_TOVEZ",cls:"vanguard",name:"Tovez",race:"Dwarf",warcry:"Meet my axe!",icon:"Tovez.png",atk:22,df:13,agi:8,hp:14,skill:"Axe Mastery",joins:{t:"level",n:5}},
 {id:"NPC_JOSLIN",cls:"shadow",name:"Joslin",race:"Human",warcry:"Haven't I killed you before!?!",icon:"Sabatemi.png",atk:9,df:10,agi:16,hp:8,skill:"Stealth",joins:{t:"level",n:7}},
 {id:"NPC_BAVAIN",cls:"vanguard",name:"Bavain",race:"Human",warcry:"Diplomacy fails again!",icon:"Bavain.png",atk:10,df:13,agi:8,hp:8,skill:"Shield Wall",joins:{t:"level",n:9}},
 {id:"NPC_DERANDT",cls:"caster",name:"Derandt",race:"Human",warcry:"Go for the eyes, Boo, go for the eyes!",icon:"Derandt.png",atk:14,df:7,agi:10,hp:6,skill:"Frostbite",joins:{t:"level",n:11}},
 {id:"NPC_MAIRSIL",cls:"vanguard",name:"Marsa",race:"Human",warcry:"Time for an amateur lobotomy!",icon:"Mairsil.png",atk:10,df:13,agi:8,hp:8,skill:"Cleave",joins:{t:"level",n:13}},
 {id:"NPC_BATTAMEL",cls:"shadow",name:"Korznik",race:"Human",warcry:"Hundreds have died in my wake. You're just a number to me.",icon:"Battamel.png",atk:9,df:10,agi:16,hp:8,skill:"Backstab",joins:{t:"level",n:15}},
 {id:"NPC_HAGEN",cls:"ranger",name:"Hagen",race:"Dwarf",warcry:"Golden!",icon:"Hagen.png",atk:8,df:10,agi:14,hp:14,skill:"Combat Training",joins:{t:"level",n:17}},
 {id:"NPC_GAVRIAL",cls:"caster",name:"Varence",race:"Human",warcry:"I've forgotten my War Cry!!",icon:"Gavrial.png",atk:12,df:7,agi:17,hp:7,skill:"Mass Paralyze",joins:{t:"level",n:19}},
 {id:"NPC_BARKSPAWN",cls:"shadow",name:"Barkspawn",race:"Mabari",warcry:"Woof!!!!",icon:"Barkspawn.png",atk:14,df:10,agi:18,hp:6,skill:"Strike",joins:{t:"streak",n:3}},
 {id:"PROMO_NPC_HAWKEM",cls:"vanguard",name:"Hawke",race:"Human",warcry:"A Champion always strikes twice.",icon:"HawkeM.png",atk:17,df:20,agi:15,hp:9,skill:"Power Strike",joins:{t:"trial"}},
 {id:"PROMO_NPC_ISABELA",cls:"shadow",name:"Isabela",race:"Human",warcry:"If we kill them, we get their stuff!",icon:"Isabela2.png",atk:8,df:10,agi:14,hp:8,skill:"Twin Fangs",joins:{t:"caches"}},
 {id:"PROMO_NPC_MORRIGAN",cls:"caster",name:"Morrigan",race:"Human",warcry:"Morrigan disapproves!",icon:"Morrigan2.png",atk:13,df:8,agi:11,hp:7,skill:"Entropy",joins:{t:"streak",n:7}},
 {id:"NPC_SHALE",cls:"vanguard",name:"Shale",race:"Golem",warcry:"Death to all pigeons!",icon:"Shale.png",atk:16,df:25,agi:10,hp:9,skill:"Stone Aura",joins:{t:"masters",n:25}},
 {id:"NPC_DRAKE",cls:"caster",name:"Fire Drake",race:"Dragon",warcry:"GRAAAAAARRRR!!!",icon:"Drake.png",atk:25,df:16,agi:17,hp:10,skill:"Flame Breath",joins:{t:"masters",n:40}},
 {id:"NPC_PRANKSTER",cls:"shadow",name:"Prankster",race:"Darkspawn",warcry:"I will steal your gifts!",icon:"Prankster.png",atk:18,df:14,agi:25,hp:9,skill:"Filch",joins:{t:"perfectExam"}},
];

(async()=>{
  for(const r of ROWS){
    const b=await sharp(ICONS+'/'+r.icon).webp({quality:80}).toBuffer();
    r.port='data:image/webp;base64,'+b.toString('base64');
    delete r.icon;
  }
  const out='/* the original guild companions (CHARACTER_GUILDNPCS.xml), verbatim */\n'+
    'DATA.eaComp='+JSON.stringify(ROWS)+';\n';
  fs.writeFileSync('/tmp/dal/comp_payload_lit.js',out);
  console.log('eaComp',ROWS.length,'companions,',(out.length/1024).toFixed(0)+'KB');
})();
