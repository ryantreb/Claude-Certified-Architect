# Dragon Age Legends Modular Skin Inventory Implementation Plan

**Goal:** Produce a complete, evidence-backed JSON inventory and matching Markdown report for every canonical modular character/creature skin symbol, weapon symbol, player head component, and self-contained creature rig in the recovered Dragon Age Legends assets.

**Architecture:** Build an evidence graph from raw SWF exports, the SWF-embedded asset manifest and ActionScript, animation/skin XML, equipment XML, character-class XML, NPC customization data, and character-creator data. Generate expected symbol names with the exact runtime rules, reconcile them in both directions against the physical SWFs, preserve aliases instead of merging them, and make the JSON the authoritative source from which all Markdown counts and summaries are derived.

**Tech Stack:** Bash, Node.js 20, Java 21, JPEXS Free Flash Decompiler 26.2.1, XML, SWF `SymbolClass`/`ExportAssets` tags, `jq`, Git

---

## Scope and planning baseline

Run all work from `/home/ryantreb/Claude-Certified-Architect`.

At planning time, the repository contains:

- Git baseline `27079eb4185f56e2cb00e2e287d8dc62f9aab5f2`.
- `reference/dalegends/DALFlashApp.swf`.
- 105 `reference/dalegends/assets/animSkins*.swf` files.
- 77 `reference/dalegends/assets/anims*.swf` files.
- 15 `reference/dalegends/data/ANIMATION_ANIM_SKINS*.xml` files.
- 11,997 non-`MainTimeline` `SymbolClass` rows across the 105 skin SWFs. This is a raw candidate count, not the final modular-symbol count.
- 111 `DALFlashApp.swf` `SymbolClass` rows with `hf_`, `hm_`, `ef_`, `em_`, `df_`, or `dw_` prefixes. This is also a candidate count.
- An embedded `AssetManifest` with 246 library entries and 14,680 symbol mappings.
- An unrelated untracked file at `docs/plans/2026-07-25-character-creation-engine.md`. Do not edit, stage, or delete it.

If the three source-family counts differ when execution begins, stop and update this plan’s source census before generating inventory rows. A changed source set invalidates a completeness claim.

## Non-negotiable guardrails

- Create only:
  - `docs/visual-remaster/inventory/modular-skins-inventory.json`
  - `docs/visual-remaster/inventory/modular-skins-inventory.md`
- Keep all extraction outputs and analysis helpers under `/tmp/dal-modular-skins-inventory-work-27079eb`.
- Do not change SWFs, XML, runtime code, artwork, baselines, existing documentation, or generated game files.
- Do not use assembled screenshots or rendered whole-character frames as source assets or primary evidence.
- Do not cite `reference/dalegends/NOTES.md` as proof. It may identify paths worth checking, but conclusions must cite the SWF, embedded manifest, XML, or decompiled runtime class directly.
- Never infer that a symbol is modular merely because its filename starts with `animSkins`. Icon-only, UI, VFX, test-timeline, and unrelated exports must be placed in a documented `scope_exclusions` audit rather than counted.
- Never infer that an `anims_*.swf` is baked merely because it has no matching filename. Require rig-content and data-reference evidence.
- Preserve exact export capitalization, punctuation, suffixes, and source SWF.

## Counting and evidence rules

Use `source_path::export_name` as the canonical `symbol_key`. The same export name in two SWFs is two source symbols. One source symbol referenced by several skin IDs, equipment rows, classes, or characters remains one symbol record with arrays of references and aliases.

The category arrays are canonical classifications:

- `body_and_equipment_skins`
- `weapons`
- `player_head_components`
- `creature_modular_skins`

The total modular-symbol count is the set union of `symbol_key` values in those four arrays. `orphan_symbols` is a reference view over that union and must not add to the total. `missing_symbols` contains expected-but-absent names and therefore never contributes to the total. Self-contained creatures are counted as creatures/rigs, not modular source symbols.

Every factual record and major conclusion needs one or more evidence objects:

```json
{
  "status": "VERIFIED",
  "source_path": "reference/dalegends/data/ANIMATION_ANIM_SKINS_WEAPONS.xml",
  "locator": "Entry[ID='skWpSimpleSword']/AssetPrefix",
  "value": "starterSword",
  "extraction_method": "direct XML parse",
  "note": "Runtime naming rule appends _weapon for DestSegment=weapon."
}
```

Allowed statuses:

- `VERIFIED`: directly present in a SWF tag, XML node, embedded manifest entry, or decompiled ActionScript statement.
- `INFERRED`: deterministic conclusion from at least two verified facts; the evidence note must state the derivation.
- `UNKNOWN`: unresolved or contradictory. Do not choose a likely answer.

For tintability:

- `yes` only when an equipment `colorId` reaches `AnimationColorArchetype.applyTintToClip`, or `CompositeHead` explicitly applies `HeadTint` to that component.
- `no` only when code bypasses tint for that component or a replacement face is inserted without tint.
- `unknown` otherwise.

For “actually referenced”:

- `data_referenced: true` requires a path from a skin/equipment/head selector/character definition to the symbol.
- Presence in the embedded manifest alone proves packaging, not active data reference.
- Keep `present_in_manifest`, `present_in_swf`, `data_referenced`, and `creator_reachable` as separate booleans.

## Required authoritative JSON contract

The JSON may add fields, but it must include these top-level keys:

```json
{
  "schema_version": "1.0.0",
  "generated_at": "ISO-8601 timestamp",
  "summary": {},
  "methodology": {},
  "sources": [],
  "rigs": [],
  "body_and_equipment_skins": [],
  "weapons": [],
  "player_head_components": [],
  "creature_modular_skins": [],
  "self_contained_creatures": [],
  "orphan_symbols": [],
  "missing_symbols": [],
  "aliases_and_duplicates": [],
  "scope_exclusions": [],
  "character_creator_findings": {},
  "unknowns": []
}
```

Every modular-symbol row must include, where applicable:

```json
{
  "symbol_key": "reference/dalegends/assets/example.swf::ExactExportName",
  "symbol_name": "ExactExportName",
  "source_swf": "reference/dalegends/assets/example.swf",
  "swf_character_ids": [],
  "export_tag_types": [],
  "skin_ids": [],
  "skin_set_names": [],
  "asset_prefixes": [],
  "piece_name": "chest",
  "intended_rig_slots": [],
  "rig_ids": [],
  "piece_list_ids": [],
  "race_restrictions": [],
  "gender_restrictions": [],
  "class_restrictions": [],
  "equipment_categories": [],
  "equipment_types": [],
  "tier_or_rarity_evidence": [],
  "tintable": "yes",
  "tint_references": [],
  "data_references": [],
  "data_referenced": true,
  "present_in_manifest": true,
  "reference_status": "REFERENCED",
  "aliases": [],
  "evidence": [],
  "notes": []
}
```

Use raw equipment fields such as `material`, `weightClass`, `minHeroLevel`, store category, or an explicit tier field as tier/rarity evidence. Do not manufacture a tier from a filename or item name.

### Task 1: Freeze the evidence boundary and source census

**Files:**
- Read: `reference/dalegends/DALFlashApp.swf`
- Read: `reference/dalegends/assets/**/*.swf`
- Read: `reference/dalegends/data/**/*`
- Create temporarily: `/tmp/dal-modular-skins-inventory-work-27079eb/source-files.txt`
- Create temporarily: `/tmp/dal-modular-skins-inventory-work-27079eb/source-checksums.tsv`

**Step 1: Verify the worktree and preserve unrelated changes**

Run:

```bash
git status --short --branch
git worktree list --porcelain
```

Expected: current branch information plus the existing untracked `docs/plans/`; no edits under `reference/dalegends`.

**Step 2: Create the isolated analysis workspace**

Run:

```bash
test ! -e /tmp/dal-modular-skins-inventory-work-27079eb
mkdir -p /tmp/dal-modular-skins-inventory-work-27079eb/{binary,script,swf-xml,reports}
```

Expected: exit 0. If the directory already exists, inspect it instead of deleting it; use a new explicit suffix consistently if it belongs to another run.

**Step 3: Enumerate every possible evidence file**

Run:

```bash
find reference/dalegends -type f \( -iname '*.swf' -o -iname '*.xml' -o -iname '*.csv' -o -iname '*.js' \) -print \
  | sort > /tmp/dal-modular-skins-inventory-work-27079eb/source-files.txt
wc -l /tmp/dal-modular-skins-inventory-work-27079eb/source-files.txt
```

Expected: a nonzero count and a sorted list that includes the main SWF, all 105 skin SWFs, all 77 animation SWFs, and all 15 skin-definition XMLs.

**Step 4: Re-run the source-family completeness checkpoints**

Run:

```bash
find reference/dalegends/assets -maxdepth 1 -type f -iname 'animSkins*.swf' | wc -l
find reference/dalegends/assets -maxdepth 1 -type f -iname 'anims*.swf' | wc -l
find reference/dalegends/data -maxdepth 1 -type f -iname 'ANIMATION_ANIM_SKINS*.xml' | wc -l
```

Expected: `105`, `77`, and `15`, respectively.

**Step 5: Hash every participating source**

Run:

```bash
xargs -d '\n' sha256sum < /tmp/dal-modular-skins-inventory-work-27079eb/source-files.txt \
  > /tmp/dal-modular-skins-inventory-work-27079eb/source-checksums.tsv
```

Expected: one checksum row per source-list row. Later, include checksums only for sources that participate in the final evidence graph.

### Task 2: Extract the embedded manifest and runtime architecture

**Files:**
- Read: `reference/dalegends/DALFlashApp.swf`
- Create temporarily: `/tmp/dal-modular-skins-inventory-work-27079eb/binary/*`
- Create temporarily: `/tmp/dal-modular-skins-inventory-work-27079eb/script/scripts/*`
- Create temporarily: `/tmp/dal-modular-skins-inventory-work-27079eb/reports/runtime-evidence.tsv`

**Step 1: Verify the decompiler version**

Run:

```bash
java -Djava.awt.headless=true -jar /tmp/ffdec/ffdec.jar -help 2>&1 | sed -n '1,3p'
```

Expected: JPEXS Free Flash Decompiler `26.2.1`. Record a different version in `methodology.tool_versions` if the tool changed.

**Step 2: Extract embedded binary data**

Run:

```bash
java -Djava.awt.headless=true -Xmx3g -jar /tmp/ffdec/ffdec.jar \
  -export binaryData \
  /tmp/dal-modular-skins-inventory-work-27079eb/binary \
  reference/dalegends/DALFlashApp.swf
```

Expected: 127 binary-data exports, including filenames containing `DMLegendsLauncher_MANIFEST_XML`, `CHARACTER_PRESET_XML`, and every animation skin XML family.

**Step 3: Extract ActionScript**

Run:

```bash
java -Djava.awt.headless=true -Xmx3g -jar /tmp/ffdec/ffdec.jar \
  -export script \
  /tmp/dal-modular-skins-inventory-work-27079eb/script \
  reference/dalegends/DALFlashApp.swf
```

Expected: 3,162 script files.

**Step 4: Locate the canonical runtime classes**

Run:

```bash
rg -n 'buildHumanMale|buildHumanFemale|buildElfMale|buildElfFemale|buildDwarfMale|buildDwarfFemale|private function assemble|hairColors|skinColors' \
  /tmp/dal-modular-skins-inventory-work-27079eb/script/scripts/com/ea2d/dal/display/character/CompositeHead.as

rg -n 'getAssetClassNameForSegment|modByRace|modByGender|getAnimSpecificClipName' \
  /tmp/dal-modular-skins-inventory-work-27079eb/script/scripts/com/ea2d/dal/model/global/anim/DAnimSkinArchetype.as

rg -n 'updateGearSlot|updateCompositeHead|skinSegment|applyTintToClip' \
  /tmp/dal-modular-skins-inventory-work-27079eb/script/scripts/com/ea2d/dal/display/animation/CharacterAnimation.as \
  /tmp/dal-modular-skins-inventory-work-27079eb/script/scripts/com/ea2d/dal/model/global/anim/AnimationColorArchetype.as
```

Expected: matches proving the symbol-name construction, gear-to-skin flow, composite-head insertion, layer assembly, and tint paths.

**Step 5: Record the runtime sources that must appear in final evidence**

The final inventory must cite these virtual locations as `reference/dalegends/DALFlashApp.swf#<qualified class>` rather than citing ephemeral `/tmp` paths:

- `com.ea2d.load.AssetManifest`
- `com.ea2d.dal.load.streaming.AssetDepot`
- `com.ea2d.dal.display.animation.CharAnimConfig`
- `com.ea2d.dal.display.animation.CharacterAnimation`
- `com.ea2d.dal.display.character.CompositeHead`
- `com.ea2d.dal.display.character.HeadTint`
- `com.ea2d.dal.model.global.anim.DAnimationDatabase`
- `com.ea2d.dal.model.global.anim.DAnimSkinArchetype`
- `com.ea2d.dal.model.global.anim.DAnimSkinPieceArchetype`
- `com.ea2d.dal.model.global.anim.DAnimSkinPieceSetArchetype`
- `com.ea2d.dal.model.global.anim.AnimationColorArchetype`
- `com.ea2d.dal.model.global.race.DRaceArchetype`
- `com.ea2d.dal.model.global.character.CharacterPresetArchetype`
- `com.ea2d.dal.display.screens.herocreate.DMHeroEdit`

Expected: each major assembly conclusion can point to one of these qualified classes and a method or constant.

### Task 3: Build a lossless raw SWF symbol census

**Files:**
- Read: `reference/dalegends/tools/symbols.js`
- Read: every `reference/dalegends/**/*.swf`
- Create temporarily: `/tmp/dal-modular-skins-inventory-work-27079eb/reports/symbol-class.tsv`
- Create temporarily: `/tmp/dal-modular-skins-inventory-work-27079eb/swf-xml/*.xml`
- Create temporarily: `/tmp/dal-modular-skins-inventory-work-27079eb/reports/export-assets.tsv`
- Create temporarily: `/tmp/dal-modular-skins-inventory-work-27079eb/reports/manifest-symbols.tsv`

**Step 1: Extract every `SymbolClass` row from every SWF**

Run:

```bash
find reference/dalegends -type f -iname '*.swf' -print0 \
  | sort -z \
  | xargs -0 node reference/dalegends/tools/symbols.js \
  > /tmp/dal-modular-skins-inventory-work-27079eb/reports/symbol-class.tsv
```

Expected: a tab-separated `character_id`, exact export name, and source filename census. Do not remove `MainTimeline` rows from the raw file; exclude them only during classification.

**Step 2: Convert all 105 skin SWFs and all potentially participating non-skin SWFs to JPEXS XML**

First parse the embedded manifest and collect every library that either:

- has an `animSkins` or `anims_` path;
- contains an export name expected from any skin definition;
- contains a player-head export selected by `CompositeHead`; or
- contains a duplicate of an already discovered modular export.

For each collected SWF, run:

```bash
java -Djava.awt.headless=true -Xmx2g -jar /tmp/ffdec/ffdec.jar \
  -swf2xml \
  reference/dalegends/assets/EXACT_SOURCE.swf \
  /tmp/dal-modular-skins-inventory-work-27079eb/swf-xml/EXACT_SOURCE.swf.xml
```

Expected: one XML per participating SWF. Include non-obvious sources when the manifest proves participation; for example, do not assume every weapon export lives only in `animSkins_Weapons_*.swf`.

**Step 3: Parse both export mechanisms**

From each JPEXS XML, extract:

- `SymbolClassTag` names and character IDs;
- `ExportAssetsTag` names and character IDs;
- `PlaceObject2Tag`/`PlaceObject3Tag` instance names used as rig segments;
- each exported sprite’s dependency closure for baked-versus-modular analysis.

Write `export-assets.tsv` with:

```text
source_path<TAB>tag_type<TAB>character_id<TAB>exact_export_name
```

Expected: every row retains its source path and tag type. A symbol found by both tag types keeps both tag types in one final record.

**Step 4: Parse the embedded asset manifest**

Locate the binary-data export whose name contains `DMLegendsLauncher_MANIFEST_XML` and write:

```text
library_path<TAB>exact_symbol_name<TAB>manifest_order
```

to `manifest-symbols.tsv`.

Expected: 246 distinct `<Library>` entries and 14,680 `<Symbol>` rows. Preserve repeated symbol names and manifest order because the runtime dictionary overwrites earlier mappings with later ones.

**Step 5: Run the raw-census sanity checks**

Run:

```bash
awk -F '\t' '$2 !~ /MainTimeline$/ {print $3 "\t" $2}' \
  /tmp/dal-modular-skins-inventory-work-27079eb/reports/symbol-class.tsv \
  | sort -u | wc -l

awk -F '\t' '$2 ~ /^(hf|hm|ef|em|df|dm|dw)_/ {print $2}' \
  /tmp/dal-modular-skins-inventory-work-27079eb/reports/symbol-class.tsv \
  | sort -u | sed -n '1,160p'
```

Expected: a nonzero all-SWF census and a player-head candidate list that includes the observed `dw_` dwarf-male prefix. Do not rewrite it to the requested example `dm_`; the final report must explicitly state which prefix the evidence uses.

### Task 4: Parse and normalize the data relationship graph

**Files:**
- Read: `reference/dalegends/data/ANIMATION_ANIM_RIGS.xml`
- Read: `reference/dalegends/data/ANIMATION_ANIM_PIECE_LISTS.xml`
- Read: all `reference/dalegends/data/ANIMATION_ANIM_SKINS*.xml`
- Read: `reference/dalegends/data/ANIMATION_ANIM_SKIN_COLORS.xml`
- Read: `reference/dalegends/data/ANIMATION_ANIMATIONS.xml`
- Read: all `reference/dalegends/data/EQUIPMENT_*.xml`
- Read: `reference/dalegends/data/ITEMSLOT_CATEGORIES.xml`
- Read: `reference/dalegends/data/ITEMSLOT_VANITYCATEGORIES.xml`
- Read: `reference/dalegends/data/CHARACTER_CHARCLASS.xml`
- Read: `reference/dalegends/data/CHARACTER_RACE.xml`
- Read: `reference/dalegends/data/CHARACTER_PRESET.xml`
- Read: `reference/dalegends/data/CHARACTER_GUILDNPCS.xml`
- Create temporarily: `/tmp/dal-modular-skins-inventory-work-27079eb/reports/data-graph.json`

**Step 1: Normalize rig entries**

For every `ANIMATION_ANIM_RIGS.xml/Entry`, record:

- `ID`
- `ChunkName`
- `AssetPrefix`
- every `Segment/@Name`
- segment section, if present
- duplicate rig IDs as separate source definitions plus an alias/duplicate issue

Expected: no skeletal rig or animation timeline is added to a modular-symbol category.

**Step 2: Expand piece lists exactly as the runtime does**

For every `ANIMATION_ANIM_PIECE_LISTS.xml/Entry`, preserve:

- piece-list `ID`;
- ordered `Piece` rows;
- `DestSegment`;
- `GenderNeutral`;
- `CachingDisallowed`;
- `ClipNameOverride`;
- every `AnimSpecificClip`, including duplicates in source XML.

When a skin uses a `PieceList`, merge it with inline `Piece` rows by `DestSegment` as `DAnimSkinPieceSetArchetype.addPiecesFromList` does. Preserve duplicate-source evidence even if the runtime dictionary resolves to one destination.

**Step 3: Normalize all skin definitions**

For every skin `Entry`, record:

- source XML path;
- `ID`;
- `AssetPrefix`;
- explicit `ChunkName` or inherited `DefaultChunkName`;
- `ModByRace`;
- `ModByGender`;
- `RasterizeIcon`;
- `IconPiece`;
- `IconSecondaryPiece`;
- each `RigPieceSet`, `RigId`, piece list, and resolved piece.

Expected: all 15 XML families are represented, including accessories and consumables even when they later become icon-only exclusions.

**Step 4: Normalize equipment references and restrictions**

For every `EQUIPMENT_*.xml/entry` with a `skinId`, preserve:

- exact equipment source path and `type`;
- `skinId`;
- `colorId`;
- `category`;
- `material`;
- `weightClass`;
- `minHeroLevel`;
- raw rarity/tier/store fields when present;
- ordered `whoEquips/entry` values;
- `avatarFrame`;
- dependent weapon/secondary fields.

Do not collapse multiple equipment rows that point to one skin. These are evidence for sharing and aliases.

**Step 5: Normalize character and NPC assembly references**

From `CHARACTER_CHARCLASS.xml`, preserve:

- class `Type` and `Name`;
- `IsMonster`;
- `UsesPlayerAnimation`;
- `UsesCompositeHead`;
- `DefaultRace`;
- `DefaultRigId`;
- `AssetFilename`;
- `AssetPrefix`;
- `InitArmor`, `InitHelmet`, `InitShield`, `InitWeapon1`, and `InitWeapon2`;
- animation tint/scale fields.

From `CHARACTER_GUILDNPCS.xml`, preserve:

- NPC ID/name;
- class, race, gender;
- `SkinType`, `SkinColor`, `HairType`, `HairColor`, and `Face`;
- primary and secondary gear.

Expected: character → rig → equipment → skin → piece paths can be reconstructed without filename guessing.

**Step 6: Record icon-only definitions without counting them**

Any skin whose resolved destinations are only `icon` is not a paperdoll attachment. Put its symbol rows in `scope_exclusions` with reason `ICON_ONLY_SKIN_DEFINITION`, source skin IDs, and equipment references.

Expected: accessory/consumable icon artwork is audited but excluded from modular totals unless another verified rig-piece relationship attaches the same source symbol to a real assembly slot.

### Task 5: Generate exact expected symbol names and source mappings

**Files:**
- Read: `/tmp/dal-modular-skins-inventory-work-27079eb/reports/data-graph.json`
- Read: `/tmp/dal-modular-skins-inventory-work-27079eb/reports/manifest-symbols.tsv`
- Read: `/tmp/dal-modular-skins-inventory-work-27079eb/reports/export-assets.tsv`
- Create temporarily: `/tmp/dal-modular-skins-inventory-work-27079eb/reports/expected-symbols.json`

**Step 1: Implement the runtime naming rule literally**

For each resolved skin piece, generate:

```text
ClipNameOverride
```

when present; otherwise:

```text
AssetPrefix
+ ("_" + race animation code when ModByRace)
+ ("_" + gender code when ModByGender and not GenderNeutral)
+ animation-specific suffix when the current animation is listed
+ "_"
+ DestSegment
```

Use `CharAnimConfig.getAnimCodeForCharacterRace`, `Gender.getAnimCode`, and `Animation.playerAnimationSuffix`/`monsterAnimationSuffix` as the source of these values. Do not assume suffix spellings.

**Step 2: Derive only reachable configuration contexts**

Generate race, gender, rig, and animation variants from verified contexts:

- player race/gender choices from `CHARACTER_RACE.xml` and creator code;
- class/weapon rig selection from `DAnimationDatabase.getRigId`;
- monster defaults from `CHARACTER_CHARCLASS.xml`;
- NPC customizations from `CHARACTER_GUILDNPCS.xml`;
- equipment restrictions from `whoEquips`;
- animation-specific pieces from `ANIMATION_ANIMATIONS.xml`.

If a symbol exists for a context not reachable from these data sources, keep it as a physical symbol and mark it `ORPHAN_OR_UNUSED`; do not invent a data relationship.

**Step 3: Resolve each expected name through the embedded manifest**

Record:

- all manifest libraries that list the name;
- effective runtime library after manifest-order overwrite;
- every physical SWF that actually exports the name;
- mismatch between manifest and physical source;
- duplicate-name and alias evidence.

Expected: source SWF attribution comes from direct packaging and SWF evidence, not from a guessed `ChunkName` → filename conversion.

**Step 4: Mark data-to-SWF failures**

For every expected symbol with no physical export in the available SWFs, add a `missing_symbols` record with:

- exact expected symbol;
- skin ID and asset prefix;
- destination segment;
- rig/context;
- generating XML/code evidence;
- manifest state;
- status `MISSING_SYMBOL`.

Expected: no missing expected symbol is also present in any category array.

### Task 6: Classify body, equipment, and weapon source symbols

**Files:**
- Create: `docs/visual-remaster/inventory/modular-skins-inventory.json`
- Read: `/tmp/dal-modular-skins-inventory-work-27079eb/reports/expected-symbols.json`
- Read: all equipment and skin-definition XML listed above

**Step 1: Create the output directory and JSON skeleton**

Use `apply_patch` to create the JSON with the required top-level keys and empty arrays.

Expected: `jq empty docs/visual-remaster/inventory/modular-skins-inventory.json` exits 0.

**Step 2: Populate player/NPC body and equipment symbols**

Include verified physical symbols for:

- body armor;
- robes/skirts and animation-specific variants;
- helmets and helmet-back pieces;
- shields and shield-front pieces;
- capes or overlays when a real destination segment exists;
- visible accessories only when attached to a verified rig segment;
- NPC humanoid body skins that participate in the same assembly system.

Do not include weapons, player head components, creature-specific body pieces, icon-only exports, animation timelines, or rigs in this array.

**Step 3: Populate weapon symbols**

For every weapon source symbol, record:

- exact export name and source SWF;
- weapon family from equipment `category`;
- attachment slot such as `weapon`, `weaponR`, `weaponShot`, or `wp_bow`;
- compatible rig IDs and rig segments;
- equipment and skin-definition references;
- active reference status;
- paired/dependent pieces;
- alternate states;
- tint references.

Keep projectile/alternate pieces separate source-symbol records connected through `dependent_symbol_keys`.

**Step 4: Audit ambiguous skin-SWF exports**

Review every non-`MainTimeline` export from every `animSkins*.swf` not already classified. Place it in exactly one of:

- a modular category;
- `scope_exclusions` with a direct reason such as `ICON_ONLY`, `VFX`, `UI`, `ANIMATION_TIMELINE`, or `UNRELATED_SPRITE`;
- `unknowns` when direct inspection cannot prove the role.

Expected: no raw skin-SWF export silently disappears from the classification audit.

**Step 5: Validate category-row completeness**

Run:

```bash
jq -e '
  all(
    (.body_and_equipment_skins + .weapons)[];
    (.symbol_key | type == "string") and
    (.symbol_name | type == "string") and
    (.source_swf | type == "string") and
    (.evidence | length > 0)
  )
' docs/visual-remaster/inventory/modular-skins-inventory.json
```

Expected: `true`.

**Step 6: Commit the first authoritative inventory slice**

Run:

```bash
git add docs/visual-remaster/inventory/modular-skins-inventory.json
git commit -m "docs: inventory DAL body and weapon source symbols"
```

Expected: only the JSON is committed. Do not stage the unrelated plan.

### Task 7: Inventory player head components and creator assembly

**Files:**
- Modify: `docs/visual-remaster/inventory/modular-skins-inventory.json`
- Read: `reference/dalegends/DALFlashApp.swf`
- Read: `reference/dalegends/data/CHARACTER_RACE.xml`
- Read: `reference/dalegends/data/CHARACTER_PRESET.xml`
- Read: `reference/dalegends/data/CHARACTER_GUILDNPCS.xml`
- Read temporarily: extracted `CompositeHead.as`, `HeadTint.as`, `DMHeroEdit.as`, and `DRaceDatabase.as`

**Step 1: Build the code-selected symbol table**

Parse every `new ExactClassName()` in:

- `buildHumanMale`;
- `buildHumanFemale`;
- `buildElfMale`;
- `buildElfFemale`;
- `buildDwarfMale`;
- `buildDwarfFemale`.

For each symbol record:

- exact class/export name;
- race and gender;
- actual prefix;
- role (`headSkin`, `eyes`, `hair`, `hair_back`, `ears`, `facial_hair`, `headband`, or `face_override`);
- selector field and selector values;
- whether the selector is within creator bounds;
- shared use by another race/gender;
- source character ID and main SWF evidence.

Expected: the report explains that prefix meaning from code and data. In particular, retain `dw_` if that is what the SWF/code proves; record the absence of `dm_` as a finding, not a normalization.

**Step 2: Distinguish creator components from NPC face overrides**

`npcFace_*`, `qm_face_*`, and equivalent whole-face replacements selected by `config.face` must be recorded as `face_override` and marked:

- `creator_reachable: false` unless `DMHeroEdit` exposes that field;
- `npc_data_referenced: true` when `CHARACTER_GUILDNPCS.xml/Face` reaches it;
- `composite_replacement: true`;
- not independently tinted when `CompositeHead.assemble(true)` bypasses normal component tinting.

Expected: composite face replacements are not misrepresented as normal interchangeable player creator parts.

**Step 3: Record exact layer order**

Use `CompositeHead.assemble` child insertion order to record bottom-to-top:

1. `hair_back`
2. `headSkin`
3. nested human-male facial hair on the head skin
4. `eyes`
5. `hair`, including nested elf-male headband where selected
6. elf ears

If code or a source revision contradicts this, use the actual order and mark the conflict.

**Step 4: Record exact tint behavior**

Capture:

- all `hairColors` entries;
- all `skinColors` entries;
- `HeadTint` color, fraction, and brightness;
- `Color.setTint` application;
- the component groups receiving hair tint;
- the component groups receiving skin tint;
- eyes and face replacements that bypass tint;
- the no-tint entries.

Expected: every head component row has `tintable` plus a component-specific explanation.

**Step 5: Reconstruct selector mappings and presets**

Record the non-identity mapping from each valid `hairType` and `skinType` value to exact symbols for every race/gender. Join all `CHARACTER_PRESET.xml/Preset` rows to their actual component symbols and tint indices.

Do not claim that `NumSkinTypes` or `NumHairTypes` proves distinct art. For example, a data selector may reuse one symbol, select a beard/headband, or point at an unreachable code branch.

**Step 6: Populate `character_creator_findings`**

Include evidence-backed findings for:

- player-available races;
- genders;
- creator selector bounds;
- skin types and actual component effects;
- skin/hair color tables;
- hairstyle mappings;
- class/default-equipment relationships;
- weapon-category-to-rig selection;
- layer order;
- tinting;
- preset-to-symbol resolution;
- unreachable or code-only options.

Expected: findings are sufficient to judge creator reconstructability without implementing the creator.

**Step 7: Commit the head and creator evidence**

Run:

```bash
git add docs/visual-remaster/inventory/modular-skins-inventory.json
git commit -m "docs: inventory DAL composite head components"
```

Expected: one JSON-only commit.

### Task 8: Classify modular and self-contained creatures

**Files:**
- Modify: `docs/visual-remaster/inventory/modular-skins-inventory.json`
- Read: `reference/dalegends/data/CHARACTER_CHARCLASS.xml`
- Read: `reference/dalegends/data/ANIMATION_ANIM_RIGS.xml`
- Read: all creature skin-definition XML
- Read: all relevant `reference/dalegends/assets/anims*.swf`
- Read: all relevant `reference/dalegends/assets/animSkins_Monsters_*.swf`

**Step 1: Build character-class assembly chains**

For every monster/creature class:

```text
CHARACTER_CHARCLASS Type
→ DefaultRigId / AssetFilename / AssetPrefix
→ InitArmor / InitHelmet / InitShield / InitWeapon*
→ equipment skinId
→ skin definition
→ piece list / exact expected symbols
→ physical source SWF
```

Expected: all creature classifications cite the complete chain or explicitly identify the missing link.

**Step 2: Classify rig + modular-skin creatures**

Classify as `RIG_PLUS_MODULAR_SKIN` only when:

- the class/gear data selects a skin;
- the skin resolves to non-icon rig segments;
- physical source symbols exist independently of the rig timeline; and
- rig placements contain the matching named destination segments.

Add every independent creature piece to `creature_modular_skins` using the same row schema as body/equipment.

**Step 3: Classify self-contained/baked creatures**

Classify as `SELF_CONTAINED_BAKED` only when:

- class/rig data points to the `anims_*.swf` rig export;
- the exported rig’s dependency closure contains its artwork inside that SWF;
- no replaceable body-skin relationship is selected for the character; and
- the apparent body artwork is not merely a placeholder intended for an unresolved skin.

For each self-contained row record:

- creature/class name;
- class IDs;
- source SWF;
- rig ID;
- exact exported animation/portrait identifiers;
- internal dependency evidence;
- absent modular-skin evidence;
- reason it is excluded from modular-symbol totals.

**Step 4: Mark ambiguity instead of guessing**

If a rig contains artwork and the data also names an unresolved or optional skin, classify it `UNKNOWN` and add a focused issue to `unknowns`. Do not choose baked or modular based on appearance alone.

**Step 5: Verify every monster class has a disposition**

Every `IsMonster` class must resolve to:

- modular creature;
- self-contained creature;
- shared humanoid body/equipment assembly;
- intentional alias/copy;
- or `UNKNOWN`.

Expected: no monster class is silently omitted, even when several class IDs share one rig/skin.

**Step 6: Commit creature classifications**

Run:

```bash
git add docs/visual-remaster/inventory/modular-skins-inventory.json
git commit -m "docs: classify DAL creature skin architecture"
```

Expected: one JSON-only commit.

### Task 9: Perform two-way reconciliation and alias analysis

**Files:**
- Modify: `docs/visual-remaster/inventory/modular-skins-inventory.json`
- Read: all temporary census and relationship reports

**Step 1: Reconcile SWF → data**

For every physically present modular symbol:

- collect all data paths that resolve to it;
- set `data_referenced: true` when at least one path exists;
- otherwise set `reference_status: ORPHAN_OR_UNUSED`;
- add its `symbol_key` and evidence to `orphan_symbols`.

Expected: orphan rows remain in their canonical category arrays and count toward total source symbols.

**Step 2: Reconcile data → SWF**

For every generated expected name:

- search every physical SWF export, not only the manifest-selected library;
- add `MISSING_SYMBOL` only when absent everywhere;
- distinguish `MANIFEST_MISMATCH` when physical art exists but packaging points elsewhere;
- distinguish `SOURCE_DUPLICATE` when multiple SWFs export the same exact name.

Expected: no missing row is caused by checking only a guessed filename.

**Step 3: Analyze aliases and duplicates**

Create `aliases_and_duplicates` rows for:

- several skin definitions pointing to one source symbol;
- several equipment rows pointing to one skin;
- identical export names in different SWFs;
- manifest overwrite cases;
- one symbol shared across character classes/races/genders;
- multiple physical pieces for one logical slot;
- `ClipNameOverride`;
- XML/export spelling or capitalization mismatches.

Do not merge the underlying symbol records.

**Step 4: Close the raw skin-SWF audit**

Assert that every non-`MainTimeline` export in all 105 skin SWFs is present in one of:

- a canonical modular category;
- `scope_exclusions`;
- `unknowns`.

Expected: the classified/excluded/unknown union equals the raw non-main-timeline skin-SWF census by `symbol_key`.

**Step 5: Compute summary counts from row sets**

Populate:

- total unique modular source symbols;
- body/equipment symbol count;
- weapon symbol count;
- player head-component symbol count;
- modular creature symbol count;
- self-contained/baked creature count;
- orphan/unreferenced symbol count;
- missing-symbol count;
- unresolved/unknown count;
- verified/inferred/unknown evidence counts;
- distinct export-name count;
- duplicate-name-across-SWF count.

Expected: total equals the union of the four modular category arrays, not their unchecked arithmetic sum.

### Task 10: Validate the authoritative JSON

**Files:**
- Modify: `docs/visual-remaster/inventory/modular-skins-inventory.json`
- Create temporarily: `/tmp/dal-modular-skins-inventory-work-27079eb/validate-inventory.mjs`

**Step 1: Write a structural validator**

Use `apply_patch` to create a temporary Node validator that:

- parses the JSON;
- verifies every required top-level key;
- verifies allowed status enums;
- verifies nonempty evidence on every conclusion/row;
- verifies unique `symbol_key` values inside each category;
- verifies category `symbol_key` → source/name consistency;
- verifies every orphan points to a real modular symbol;
- verifies no missing symbol points to a present physical symbol;
- verifies every source path exists or is a `DALFlashApp.swf#qualified.class` virtual locator;
- verifies all summary counts against computed sets;
- verifies the full raw skin-SWF audit closure;
- prints the final count object only on success.

**Step 2: Run syntax and structural validation**

Run:

```bash
jq empty docs/visual-remaster/inventory/modular-skins-inventory.json
node /tmp/dal-modular-skins-inventory-work-27079eb/validate-inventory.mjs
```

Expected: both commands exit 0; the validator prints the exact final category counts.

**Step 3: Inspect unresolved items**

Run:

```bash
jq '{missing_symbols: [.missing_symbols[] | {symbol_name, status, evidence}], unknowns}' \
  docs/visual-remaster/inventory/modular-skins-inventory.json
```

Expected: every unresolved item states precisely what evidence is absent and does not contain a guessed classification.

**Step 4: Run a claim audit**

Use `@verify-claims` against the JSON’s summary, architecture findings, creature classification rules, prefix meanings, layer order, and tint behavior. Verify only against repository files and the decompiled `DALFlashApp.swf`; no web sources are needed.

Expected: all major conclusions are `VERIFIED`, or are explicitly marked `INFERRED`/`UNKNOWN` with supporting evidence.

### Task 11: Generate the human-readable Markdown report

**Files:**
- Create: `docs/visual-remaster/inventory/modular-skins-inventory.md`
- Read: `docs/visual-remaster/inventory/modular-skins-inventory.json`

**Step 1: Write the BLUF from validated JSON counts**

Start with:

```markdown
# Dragon Age Legends Modular Skins Inventory

## BLUF
```

Include all eight requested counts:

1. total unique modular source symbols;
2. body/equipment symbols;
3. weapon symbols;
4. player head-component symbols;
5. modular creature symbols;
6. self-contained/baked creatures;
7. orphan/unreferenced symbols;
8. unresolved or missing references.

State the `symbol_key` identity rule so readers understand duplicate names in different SWFs.

**Step 2: Add methodology and architecture findings**

Document:

- physical source discovery;
- embedded manifest extraction;
- SWF export extraction;
- XML relationship expansion;
- exact runtime name generation;
- category/exclusion rules;
- creature baked/modular proof tests;
- two-way reconciliation.

Every architecture claim must cite a canonical path plus XML locator, SWF/export name, or qualified runtime class/method.

**Step 3: Add the requested grouped sections**

Use these exact headings:

- `## Player body/equipment skins`
- `## Weapons`
- `## Player head components by race/gender`
- `## Modular creatures`
- `## Self-contained creatures`
- `## Orphans`
- `## Missing references`
- `## Unknowns`

For large categories, show counts by source SWF, set, slot, race/gender, and reference status. Keep every row in JSON; do not create an unreadable 10,000-row Markdown table.

**Step 4: Add `Character Creator Assembly Findings`**

Use the exact heading:

```markdown
## Character Creator Assembly Findings
```

Document only verified or labeled inferred findings for races, genders, selector bounds, actual skin/head effects, tint palettes, hairstyles, independent components, equipment relationships, class/weapon rig choice, layer order, and preset resolution.

Explicitly call out:

- actual meanings of `hf_`, `hm_`, `ef_`, `em_`, `df_`, and the evidence-backed dwarf-male prefix;
- non-identity hair selector maps;
- shared hair symbols;
- facial-hair/headband behavior;
- face overrides versus normal creator components;
- selector values that are code-only or outside data bounds.

**Step 5: Add completeness and queue-readiness conclusions**

State:

- whether the source set is sufficient to define a complete remaster queue;
- what gaps prevent a fully definitive queue, if any;
- whether data/code are sufficient to reconstruct the original character creator;
- what creator behavior remains unknown, if any.

Use `UNKNOWN` rather than a qualified “probably” when evidence is missing.

**Step 6: Cross-check Markdown counts against JSON**

Create a temporary count report with:

```bash
jq '.summary' docs/visual-remaster/inventory/modular-skins-inventory.json
rg -n 'Total unique|Body/equipment|Weapon|head-component|Modular creature|Self-contained|Orphan|Missing|Unknown' \
  docs/visual-remaster/inventory/modular-skins-inventory.md
```

Expected: every Markdown BLUF number exactly matches JSON.

**Step 7: Commit the report**

Run:

```bash
git add docs/visual-remaster/inventory/modular-skins-inventory.md
git commit -m "docs: report DAL modular skin inventory findings"
```

Expected: only the Markdown report is committed.

### Task 12: Final integrity and handoff

**Files:**
- Verify: `docs/visual-remaster/inventory/modular-skins-inventory.json`
- Verify: `docs/visual-remaster/inventory/modular-skins-inventory.md`

**Step 1: Re-run all artifact validations**

Run:

```bash
jq empty docs/visual-remaster/inventory/modular-skins-inventory.json
node /tmp/dal-modular-skins-inventory-work-27079eb/validate-inventory.mjs
```

Expected: exit 0 and stable counts.

**Step 2: Verify required Markdown sections**

Run:

```bash
for heading in \
  '## BLUF' \
  '## Player body/equipment skins' \
  '## Weapons' \
  '## Player head components by race/gender' \
  '## Modular creatures' \
  '## Self-contained creatures' \
  '## Orphans' \
  '## Missing references' \
  '## Unknowns' \
  '## Character Creator Assembly Findings'; do
  rg -F "$heading" docs/visual-remaster/inventory/modular-skins-inventory.md >/dev/null || exit 1
done
```

Expected: exit 0.

**Step 3: Verify no protected files changed**

Run:

```bash
git status --short -- reference/dalegends index.html mobile tests
git diff --stat HEAD -- docs/visual-remaster/inventory
```

Expected: no changes under original assets, runtime, generated mobile output, or tests. Only the two requested inventory deliverables should appear in the inventory diff.

**Step 4: Review commit scope**

Run:

```bash
git log --oneline --decorate -5
git status --short
```

Expected: logical documentation commits plus the pre-existing unrelated untracked plan. Do not commit or remove that unrelated file.

**Step 5: Skip runtime tests with an explicit rationale**

Do not run Playwright: the work creates documentation artifacts only and must not touch runtime code or baselines. Record JSON structural validation, reconciliation validation, Markdown cross-checks, and protected-file checks as the relevant tests.

**Step 6: Deliver the requested final response**

Report:

1. total modular source-symbol count;
2. counts by category;
3. both exact inventory paths;
4. important gaps and unknowns;
5. whether the repository contains enough evidence to define the complete artwork remaster queue;
6. whether the evidence is sufficient to reconstruct the original character creator.

Stop after the inventory and findings. Do not begin artwork or creator implementation.
