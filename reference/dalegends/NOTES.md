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

Build chain (all in /tmp/dal): `headskin.js` slices headSkin+hair out of the
app SWF into a one-symbol skin (`hfHead_head`, plus empty `hfHead_helmet*` to
blank the helmet slots); `compose2.js` (multi-skin compose.js: per-skin id
offsets, optional `extra` placement→symbol maps for weaponR/skirt/wp_bow);
`hero_pipeline.js plan/assemble` exports the composed rigs to the
`DATA.eaRig.hero{War,Rog,Mag,Arc}` payload (idle/strike/special/dmg/death/
fwd/evade/block + portrait, action_frames kept).

## Combat numbers recovered for the d20 layer

DATA.eaStats now carries Defense/Agility medians per shape (same CHARCLASS
extraction; skeleton/arcaneHorror rows are matched by Name — they ship no
DefaultRigId). foeGuard = 8 + def/16 + agi/28 (clamp 8–15, boss +1);
foeThreat = 9 + atk/8 (clamp 10–16, boss +1). DATA.eaWeapons holds three
originals per tier per class from EQUIPMENT_WEAPON.xml; tier = +to-hit,
agility>0 = +1 crit range. All tactical only — mastery never moves with any
of it.
