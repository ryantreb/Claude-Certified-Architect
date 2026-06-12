# DA Legends — recovered ground truth

Extracted from `DALFlashApp.swf` (offline build; data formerly server-side is
embedded as DefineBinaryData tags). Decompiled with JPEXS ffdec 26.2.1.

## Battle screen geometry (from com.ea2d.dal.display.battle.BattleDisplay)

```
DISP_WIDTH  = 760        // battle viewport
DISP_HEIGHT = 730
BATTLE_X    = 150        // grid origin
BATTLE_Y    = 190
PARTY_SLOT_WIDTH  = 150  // cell size, both axes
PARTY_SLOT_HEIGHT = 150
PARTY_SLOT_PER_ROW_OFFSET_X = 0
BG_TILE_WIDTH = 800      // one background per wave, side by side
```

Slot → pixel (col 0 = front column, row 0..2 top→bottom):

```
player:  x = 300 - col*150        (cols at x=300, x=150)
enemy:   x = 510 + col*150        (cols at x=510, x=660)
both:    y = 190 + row*150        (rows at y=190, 340, 490)
wave w shifts everything +800*w; camera centers at (800*w+400, 365)
```

Backgrounds render at 800×600 (battleBG*.swf, frame 1).

## Animation contract (per anims_*.swf)

- Symbol names: `<creature>_<kind>Anim_<n>` plus `<creature>_portrait`,
  `<creature>_escape`, special moves (e.g. `genlock_harden`).
  Kinds: `idleAnim`, `strikeAnim_1..3`, `dmgAnim`, `deathAnim`, `fwdAnim`.
- Strike timelines carry a `FrameLabel "action_frame"` — the exact frame the
  hit lands (sync damage popups/sfx to it). SWF frame rate applies.
- Creatures are bone rigs (named parts: torso, head, armUpperR, …); the
  `animSkins_*.swf` files carry per-equipment part art attached onto rigs.
  `data/ANIMATION_ANIM_RIGS.xml`, `ANIM_PIECE_LISTS.xml`, `ANIM_SKINS*.xml`
  define the assembly; `ANIMATION_ANIMATIONS.xml` is the registry.
- Practical export for Weavefall: render whole symbols to PNG frame
  sequences (verbatim palettes) rather than re-implementing rig assembly.

## Data layer (data/ — 115 files, the embedded server data)

Combat: SKILLS_{WARRIOR,ROGUE,MAGE,MONSTERS,CONSUMABLES,IMMUNITIES}.xml,
SKILL_TREES, COMBAT_EFFECTS, COMBATWAVESETS (927KB — every wave comp),
MONSTER_GROUPINGS, ENCOUNTER_ENCOUNTERS, ENCOUNTER_LEVELSETS, WARCRIES,
COMBATSCORING, SKILLUSAGERESTRICTIONS.

Characters: CHARACTER_CHARCLASS.xml (full stat blocks for player classes AND
all monsters: InitMaxHealth/Attack/Defense/Agility/Luck/Stamina, TacticalPos,
XPForDefeat, AssetFilename/AssetPrefix → which anims_*.swf renders it),
CHARACTER_LEVELING, CHARACTER_RACE, CHARACTER_PRESET.

Skills XML fields worth copying exactly: Cost, MinRange/MaxRange, StatAction
damage/heal/effects, CharacterAnimation (BA_* id), SoundActionFrame,
CamShakeOnAction, IconFrame.

Also: EQUIPMENT_*, QUESTS per region (GD/KW/OR/PF/PP/WS), WORLD_REGIONS,
GLOBAL_GAMEVARIABLES, STRINGS_* (all UI text incl. BATTLESTRINGRESOURCES).

## Rigs vs skins — how the art actually ships

Creature `anims_*.swf` files come in two kinds:

- **Self-contained** (baked paint): deymour, soleil, tianne, beirus, desire,
  deepstalker, spiders, arcaneHorror, and the elemental drakes
  (`anims_drakeFire/Frost/Nature/Shock`). Export directly.
- **Bare rigs** (magenta/cyan placeholder pieces): genlock, skeleton, ogre,
  golem, corpse, shadeDemon, rageDemon, mabari, golemShale, bronto, the plain
  drake, and all humanoid mobs. Their paint lives in `animSkins_Monsters_*.swf`
  as per-piece symbols named `<prefix>_<pieceName>` (e.g. `genlock_shinR`);
  the game attaches them onto rig placements named `shinR`, `torso`, `head`…

`tools/compose.js` reproduces that composition offline: ffdec `-swf2xml` both
files, import the skin's Define tags (ids +20000), retarget every named piece
placement to the skin symbol, `-xml2swf` back. Verified pixel-faithful.

Skin sources used (file :: prefix): Genlock::genlock,
Skeleton_Normal::skeletonNormal, Ogre::ogre, Biped_Journeys::golem,
Corpse_Normal::corpseNormal, ShadeRageDemons::shadeDemon|rageDemon,
Mabari::mhA, Biped::golemShale, Spirit_Corrupted::bronto.
The "dragon" payload key uses the baked `anims_drakeFire.swf`.

## EA stat medians per Weavefall foe shape (CHARCLASS, by rig)

goblin hp12 atk25 · ghost 16/55 · golem 12/26 · zombie 10/18 · spider 11/30 ·
ogre 24/60 · skeleton 10/20 · wisp 12/28 · banshee 18/60 · slime 10/26 ·
minotaur 15/29 · dragon 16/35 · portal 24/70 (xp 5–18). Wired into combat as
DATA.eaStats: foe vitality scales by hp/12 (clamp 0.7–2, +6 halves cap) and
hit strength by atk/30 (clamp 0.75–1.6); the exam gauntlet is exempt so its
question-count pacing stays exact. No XP flows from kills — meters stay
mastery-only.

## Regenerating exports (tools)

```
# decompile all ActionScript (≈3,162 classes, com.ea2d.dal.* is the game)
java -jar ffdec.jar -export script OUT DALFlashApp.swf
# embedded data XMLs
java -jar ffdec.jar -export binaryData OUT DALFlashApp.swf
# render a background to PNG (800×600)
java -jar ffdec.jar -export frame OUT assets/battleBGForest.swf
# map symbol names / frame counts / action_frame labels / fps (no ffdec needed)
node tools/meta.js assets/anims_genlock.swf
# attach a skin onto a bare rig (see table above for file::prefix pairs)
node tools/compose.js assets/anims_genlock.swf \
  assets/animSkins_Monsters_Genlock.swf genlock /tmp/genlock.swf
# full payload build (frames -> trimmed webp -> DATA.eaRig/DATA.eaBg JS)
node tools/pipeline2.js plan && bash -c 'xargs -P3 -I{} bash -c "{}" </tmp/dal/cmds2.txt'
node tools/pipeline2.js assemble
```

ffdec: github.com/jindrapetrik/jpexs-decompiler (needs Java 11+). The pipeline
scripts assume ffdec at /tmp/ffdec/ffdec.jar, sharp at /tmp/dal/npm, and write
to /tmp/dal/out2 — adjust the constants at the top when running elsewhere.
Payload knobs: webp q70, frame step 2 (heavy creatures 3, deaths 3–4), every
strike keeps its action_frame; creatures export at in-game AnimScale.

## Player heroes — rig + multi-skin composition

The `anims_HumanElf_<WEAPON>.swf` files (2H/DUAL/STAFF/BOW…) are the player
rigs: full timelines named `hf_<class>_<outfit>_<anim>` (idle_1, attack_1,
special_1..4, dmg_1, death_1, fwd_1, evade, defend_1, portrait, plus the
w_of_/w_de_/w_co_ skill anims) — but BARE rigs: every named placement
(armForeL…waist, head, helmet(Back), weapon(R), wp_bow, robe skirt) is
placeholder. The paint:

- body armor: `animSkins_HumanElf_{Heavy,Leather,Robe}_{Basic,Standard,…}.swf`
  as `<set>_{m,f}_<piece>` (Basic = the starter looks: quartzArmor,
  rippedLeatherArmor, dirtyRobes; robes add `<set>_fwd_1_skirt` etc.)
- weapons: `animSkins_Weapons_*.swf` as `<set>_weapon`
  (starterGreatsword/starterDagger/starterStaff/bow_starterShort are the
  originals' starting arms)
- head: NOT in any animSkins file — `DALFlashApp.swf` carries the avatar
  parts (`hf_headSkin[_2..6]`, `hf_hair_1..12[_back]`, hm_/ef_/em_/df_/dm_
  for the other race-genders, matching CHARACTER_PRESET.xml skin/hair ids).

Build chain (all in /tmp/dal): `headskin2.js` slices the preset heads out of
the app SWF into per-hero skins (`hfHead_head`, plus empty `hfHead_helmet*` to
blank the helmet slots); `compose2.js` (multi-skin compose.js: per-skin id
offsets, optional `extra` placement→symbol maps for weaponR/skirt/wp_bow);
`hero_pipeline.js plan/assemble` exports the composed rigs to the
`DATA.eaRig.hero{War,Rog,Mag,Arc}` payload (idle/strike/special/dmg/death/
fwd/evade/block + portrait, action_frames kept).

### Heads, the real algorithm (CompositeHead.as, decompiled from DALFlashApp)

`com/ea2d/dal/display/character/CompositeHead.as` is the avatar head builder.
Layer order bottom→top: `hair_back` → `headSkin` (beard nested on top, human
male only) → `eyes` → `hair` (elf-male skinType 2 nests `em_headband` into the
hair sprite, so it inherits the hair tint) → elf `ears`. Race-gender symbol
prefixes: hf/hm (human f/m), ef/em (elf), df/dw (dwarf). Elves have a single
headSkin each plus separate `ef_ear`/`em_ears`/`*_eyes` overlays; elf-female
hair borrows `hf_hair_*` symbols. The hairType→symbol switch tables are NOT
identity maps (e.g. human-female hairType 3 → `hf_hair_1`, elf-female 3 →
`hf_hair_3`, human-male 5 → `hm_hair_1`); human-male skinType doubles as the
beard selector (`hm_facial_1..5` for types 2..6).

Tints: `skinColors[10]`/`hairColors[10]` arrays of `HeadTint(color, fraction)`
applied as `fl.motion.Color.setTint` — multipliers `1-fraction`, offsets
`round(channel*fraction)`, i.e. CXFORM mult 128 + add color/2 at the shipped
fraction 0.5 (index 9 = no tint). skinColors: 16441285, 16240275, 13668706,
15708306, 12548926, 7424821, 16577504, 4862756, 3090212. hairColors: 0,
5915442, 15585637, 3751505, 10374456, 14640941, 13092807, 7097197, 11372869.
SkinColor/HairColor in CHARACTER_PRESET.xml index straight into these tables.

The four hero loadouts are CHARACTER_PRESET.xml rows rendered through those
tables, with gendered Basic armor pieces:
- Warrior: human male, preset M1 (skin 1 / color 4, hair 2 / color 0),
  `quartzArmor_m`
- Rogue: human female, preset F4 (skin 1 / color 5, hairType 7 → hf_hair_7
  +back / color 2), `rippedLeatherArmor_f`
- Mage: elf male, preset M2 (skinType 2 → em_headband, color 3, hairType 11 →
  em_hair_11 / color 1), `dirtyRobes_m`
- Archer: elf female, preset F3 (single ef_headSkin / color 6, hairType 3 →
  hf_hair_3 / color 4, ef_ear overlay), `rippedLeatherArmor_f`

Dwarf player rigs exist too (`anims_Dwarf_{1H,2H,CROSS,DUAL}` — no STAFF, no
BOW: dwarves got crossbows and no mages) with `df_`/`dw_` head parts (dw male
"hair" slots are beards `dw_beard_1..12`) — unused so far.

## Combat numbers recovered for the d20 layer

DATA.eaStats now carries Defense/Agility medians per shape (same CHARCLASS
extraction; skeleton/arcaneHorror rows are matched by Name — they ship no
DefaultRigId). foeGuard = 8 + def/16 + agi/28 (clamp 8–15, boss +1);
foeThreat = 9 + atk/8 (clamp 10–16, boss +1). DATA.eaWeapons holds three
originals per tier per class from EQUIPMENT_WEAPON.xml; tier = +to-hit,
agility>0 = +1 crit range. All tactical only — mastery never moves with any
of it.

## The full original feature layer (passes 11–16)

- **Audio** (`audio_payload.js`, pass 11): every audio.swf sample (202) in
  `DATA.eaSnd`; the music loops (Castle/ChooseParty/Combat/Quest +
  deep_roads1_lp) in `DATA.eaMusic`. Sfx gained a lazy-decode sample player
  (synth kept as fallback; EAMAP routes click/win/lose/levelup/open to the
  original cues; footsteps rotate da_flash_pc_walk1..5). Music follows MODE
  (battle/keep/world+map) plus the party picker; `S.settings.music` gates it.
  Voice barks: hero gender → male / ss_elf_woman sets; foes grunt by shape
  (genlock/ogre/spider/shriek sets).
- **VFX** (`fx_pipeline.js`, pass 12): `DATA.eaFx` = 20 vfx/vfx_ui exports
  (fireball/bolt/frost pairs, lightning, heal, buffs, powerFlash, levelUp,
  arrow, six banners); `DATA.eaPartIcon` = the seven resistance damage-burst
  icons. The burst engine reproduces ParticleSys verbatim: seed angle random
  0–360°, v = rand(0..velRand)/2 + vel, gravity accumulates g·f/10 per frame,
  constant force lift, size 5→0 over 0.5 s at 24 fps (numbers from
  EFFECTS_PARTICLEEFFECTS.xml rows; pools 25, magic 18). dt is treated as one
  24fps frame-step (px/frame velocities) — the one interpretive call.
- **Overworld** (pass 13): `DATA.eaWorldMap` = DMMapScreenSWF parchment
  (767×615) + DMMapRegionIconSWF scroll + DMMapPlayerCastleSWF castle;
  `DATA.eaWorld` = the WORLD_REGIONS.xml graph verbatim (Castle 360,180 …
  Orzammar 175,455; R_T shares the castle's coords in the XML and is nudged
  to 300,228 for a visible marker — placement-only deviation). MAPBIND walks
  study regions along Estate→Pass→Forest→Dales→Sea; trial at Orzammar. The
  screen is read-only over region/road state.
- **Companions** (`comp_payload.js`, pass 14): `DATA.eaComp` = 20
  CHARACTER_GUILDNPCS battle NPCs (stats/warcries/portraits verbatim; the
  duplicate tutorial Derandt dropped). Join rules are read-only milestone
  derivations (region bosses, levels, streaks, badges, caches, mastered
  count, perfect practical). Tactical only: atk/12→hit, def/12→guard,
  agi≥16→crit.
- **Items** (pass 15): `DATA.eaItems` = 2,074 real EQUIPMENT_* rows
  ([name,def,atk,agi,luck,health,power,weightClass]). Vault + worn slot per
  type; derived caps: def→guard +3, atk→hit +2, agi≥12→crit +1,
  health/4→halves, power≥4→mana. Drops by weightClass ≤ region tier (+boss).
- **Castle & quests** (pass 16): `DATA.eaRooms` = ten CastleRoom_*_MC
  backdrops over the keep cards (HeroRoom/Training/Treasury/Tavern/Library/
  Infirmary/GreatHall/Throne/Alchemy/Market). `DATA.eaQuests` = the original
  quest lines from STRINGS_QUESTSTRINGRESOURCES (PP/PPR/PF/GD/WS/KW/OR, 60+
  quests, names + openings, {%HeroName%}→Architect). QUESTBIND maps region
  index → chain; wins+boss turn the pages; objective chip carries the name.
  Flavor only — progression still moves on mastery alone.
- **Skills**: the SKILLS table now wears the original SKILL_SKILLS_* names
  on the same mechanical frame — Warrior: Strike/Shield Bash/Shield Charge;
  Rogue: Dirty Fighting/Backstab/Whirlwind; Archer: Bow Shot/Pinning Shot/
  Mass Volley; Mage: Bolt/Frostbite/Storm (costs and slots unchanged, deep
  recall still gates every costed skill).

## Road over the original quest maps, page by page (pass 17)

`map_pipeline2.js` rebuilt `DATA.eaMap` as campaign-keyed page sets — every
page of PP(5)/PF(7)/GD(6)/WS(7)/OR(7) plus WC(5) for the Crossweave; 37 maps,
webp q68, each with its ENCOUNTER_LEVELSETS trail (BFS trunk of the Location
connection graph, MapX/MapY map-pixels). `regionRoadPage(tr,rid)` resolves a
region's CURRENT page: QUESTBIND names the set, progression state 0..4
(wins 0-3, then the felled boss) spreads across the set's pages, so PP walks
1→5 exactly and longer sets skip-stride. `layoutRoads()` re-anchors nodes on
that page (re-run on endBattleUI — pages turn when you return to the road);
`heroMP`/`mapCam`/`nodeScreenXY` follow {key,page}. `worldLoop()` picks the
world music: Orzammar pages play `deep_roads1_lp`, everywhere else the quest
loop; `showBanner` re-syncs on arrival. regionRoadPage peeks S read-only
(boot runs layoutRoads before S exists — guarded). There is exactly ONE
overworld in the build (DMMapScreenSWF — WORLD_CONTINENTS ships a single
continent); journeys beyond the Marches happen on these zone maps, as in the
original.
