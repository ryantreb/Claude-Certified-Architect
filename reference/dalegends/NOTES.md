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

## Regenerating exports (tools)

```
# decompile all ActionScript (≈3,162 classes, com.ea2d.dal.* is the game)
java -jar ffdec.jar -export script OUT DALFlashApp.swf
# embedded data XMLs
java -jar ffdec.jar -export binaryData OUT DALFlashApp.swf
# render a background to PNG (800×600)
java -jar ffdec.jar -export frame OUT assets/battleBGForest.swf
# creature animation frames as PNGs (use -zoom 2 for 2x)
java -jar ffdec.jar -zoom 2 -export sprite OUT assets/anims_genlock.swf
# map exported sprite IDs to animation names
node tools/symbols.js assets/anims_genlock.swf
```

ffdec: github.com/jindrapetrik/jpexs-decompiler (needs Java 11+).
