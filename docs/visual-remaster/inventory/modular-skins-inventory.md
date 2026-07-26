# Dragon Age Legends Modular Skins Inventory

## BLUF

The inventory contains **11552** unique modular source symbols using the identity rule `source_path::exact_export_name`. The mutually exclusive categories are **5201** body/equipment symbols, **538** weapon symbols, **130** player head components, and **5683** modular creature symbols. It records **0** verified self-contained/baked creatures, **0** orphan/unreferenced symbols, **0** missing generated references, and **2699** unresolved findings (628 raw skin-SWF exports plus unproven expected contexts and 656 unresolved creature classes). Evidence totals are **14646** verified, **14010** inferred, and **0** unknown; the source census has **15753** distinct export names and **97** names present across multiple SWFs.

## Methodology

The JSON is authoritative. It was generated from a SHA-256 source census, raw `SymbolClass` extraction from every SWF, the embedded asset manifest, skin/piece-list/equipment XML, character-class XML, and decompiled runtime classes. The name rule is documented in `reference/dalegends/DALFlashApp.swf#com.ea2d.dal.data.animation.DAnimSkinArchetype.getAssetClassNameForSegment`; each derived name is marked `INFERRED` and paired with its physical `SymbolClassTag` evidence. Data relationships come from `reference/dalegends/data/ANIMATION_ANIM_SKINS*.xml` entries and resolved `ANIMATION_ANIM_PIECE_LISTS.xml` pieces. Duplicate export names are never merged across SWFs. Structural, provenance, reconciliation, raw-audit, and report-count validation results are recorded in `validation`.

## Player body/equipment skins

By source SWF:
- reference/dalegends/assets/animSkins_Bandit_Heavy_Standard.swf: 64
- reference/dalegends/assets/animSkins_Bandit_Leather_Standard.swf: 64
- reference/dalegends/assets/animSkins_Bandit_Robe_Standard.swf: 32
- reference/dalegends/assets/animSkins_Elf_Heavy_Standard.swf: 32
- reference/dalegends/assets/animSkins_Elf_Leather_Standard.swf: 64
- reference/dalegends/assets/animSkins_Elf_Robe_Standard.swf: 66
- reference/dalegends/assets/animSkins_Helmets_DA2.swf: 108
- reference/dalegends/assets/animSkins_Helmets_Originals.swf: 50
- reference/dalegends/assets/animSkins_Helmets_Promo.swf: 64
- reference/dalegends/assets/animSkins_Helmets_Vanity.swf: 75
- reference/dalegends/assets/animSkins_HumanElf_Buffs.swf: 32
- reference/dalegends/assets/animSkins_HumanElf_GreyWarden.swf: 96
- reference/dalegends/assets/animSkins_HumanElf_Heavy_Basic.swf: 32
- reference/dalegends/assets/animSkins_HumanElf_Heavy_Premium.swf: 192
- reference/dalegends/assets/animSkins_HumanElf_Heavy_PremiumB.swf: 128
- reference/dalegends/assets/animSkins_HumanElf_Heavy_PremiumC.swf: 128
- reference/dalegends/assets/animSkins_HumanElf_Heavy_Promo.swf: 160
- reference/dalegends/assets/animSkins_HumanElf_Heavy_PromoB.swf: 128
- reference/dalegends/assets/animSkins_HumanElf_Heavy_Standard.swf: 160
- reference/dalegends/assets/animSkins_HumanElf_Hurlock.swf: 95
- reference/dalegends/assets/animSkins_HumanElf_Leather_Basic.swf: 32
- reference/dalegends/assets/animSkins_HumanElf_Leather_Premium.swf: 224
- reference/dalegends/assets/animSkins_HumanElf_Leather_PremiumB.swf: 96
- reference/dalegends/assets/animSkins_HumanElf_Leather_Promo.swf: 160
- reference/dalegends/assets/animSkins_HumanElf_Leather_PromoB.swf: 128
- reference/dalegends/assets/animSkins_HumanElf_Leather_Standard.swf: 192
- reference/dalegends/assets/animSkins_HumanElf_NPC.swf: 200
- reference/dalegends/assets/animSkins_HumanElf_Robe_Basic.swf: 33
- reference/dalegends/assets/animSkins_HumanElf_Robe_Premium.swf: 231
- reference/dalegends/assets/animSkins_HumanElf_Robe_PremiumB.swf: 99
- reference/dalegends/assets/animSkins_HumanElf_Robe_Promo.swf: 164
- reference/dalegends/assets/animSkins_HumanElf_Robe_PromoB.swf: 128
- reference/dalegends/assets/animSkins_HumanElf_Robe_Standard.swf: 231
- reference/dalegends/assets/animSkins_HumanElf_Shadow.swf: 96
- reference/dalegends/assets/animSkins_HumanElf_Vanity_A.swf: 112
- reference/dalegends/assets/animSkins_HumanElf_Vanity_B.swf: 175
- reference/dalegends/assets/animSkins_HumanElf_Worker.swf: 32
- reference/dalegends/assets/animSkins_Monsters_Bandit.swf: 121
- reference/dalegends/assets/animSkins_Monsters_Cultist.swf: 204
- reference/dalegends/assets/animSkins_Monsters_dalishBandit1.swf: 255
- reference/dalegends/assets/animSkins_Monsters_dalishBandit2.swf: 255
- reference/dalegends/assets/animSkins_Shields.swf: 94
- reference/dalegends/assets/animSkins_WarDog_NPC.swf: 84
- reference/dalegends/assets/animSkins_Weapons_Winter.swf: 2
- reference/dalegends/assets/animSkins.swf: 68
- reference/dalegends/assets/FencingRoom.swf: 2
- reference/dalegends/assets/ProTip_Character2.swf: 3
- reference/dalegends/assets/QuestIcons.swf: 8
- reference/dalegends/assets/TrainingRoom.swf: 2

By set:
- ANIMATION_ANIM_SKINS_HEAVY.xml: 1443
- ANIMATION_ANIM_SKINS_HELMETS.xml: 297
- ANIMATION_ANIM_SKINS_LEATHER.xml: 1963
- ANIMATION_ANIM_SKINS_NPC.xml: 252
- ANIMATION_ANIM_SKINS_ROBE.xml: 1078
- ANIMATION_ANIM_SKINS_SHIELDS.xml: 100
- ANIMATION_ANIM_SKINS.xml: 612

By slot:
- armForeL: 290
- armForeR: 290
- armUpperL: 291
- armUpperR: 291
- backFootFar: 4
- backFootNear: 4
- backShinFar: 4
- backShinNear: 4
- backThighFar: 4
- backThighNear: 4
- backToesFar: 4
- backToesNear: 4
- body: 4
- chest: 290
- footL: 289
- footR: 289
- foreArmFar: 4
- foreArmNear: 4
- forePawFar: 4
- forePawNear: 4
- foreShoulderFar: 4
- foreShoulderNear: 4
- hackles: 4
- handL: 288
- handL1: 1
- handR: 289
- handR1: 1
- head: 55
- head2: 4
- head3: 4
- head4: 4
- helmet: 253
- helmetBack: 44
- hips: 289
- neck: 4
- shield: 50
- shieldFront: 50
- shinL: 289
- shinR: 289
- shoulderL: 1
- shoulderR: 1
- skirt: 58
- skirtGradient: 29
- tailA: 1
- tailB: 1
- tassetBack: 232
- tassetRag: 1
- thighL: 289
- thighR: 289
- torso: 1
- undies: 1
- waist: 289

By race/gender:
- HUMAN_OR_ELF / DWARF / UNRESTRICTED: 15
- UNRESTRICTED / MALE / FEMALE: 3748
- UNRESTRICTED / UNRESTRICTED: 1438

By reference status:
- REFERENCED: 5201

## Weapons

By source SWF:
- reference/dalegends/assets/animSkins_Monsters_ArcaneHorror.swf: 9
- reference/dalegends/assets/animSkins_Monsters_Biped_Journeys.swf: 3
- reference/dalegends/assets/animSkins_Monsters_CartaDwarves.swf: 6
- reference/dalegends/assets/animSkins_Monsters_Golem_Mage.swf: 3
- reference/dalegends/assets/animSkins_Monsters_Hurlock_Bolter.swf: 8
- reference/dalegends/assets/animSkins_Monsters_Hurlock_Mages.swf: 13
- reference/dalegends/assets/animSkins_Monsters_Hurlock.swf: 6
- reference/dalegends/assets/animSkins_Monsters_Raiders.swf: 6
- reference/dalegends/assets/animSkins_Monsters_Skeleton_Archer.swf: 8
- reference/dalegends/assets/animSkins_Monsters_Skeleton_Bolter.swf: 6
- reference/dalegends/assets/animSkins_Monsters_Skirt.swf: 1
- reference/dalegends/assets/animSkins_Weapons_1h_Axes.swf: 34
- reference/dalegends/assets/animSkins_Weapons_1h_Maces.swf: 35
- reference/dalegends/assets/animSkins_Weapons_1h_Swords.swf: 45
- reference/dalegends/assets/animSkins_Weapons_1h_Thrown.swf: 38
- reference/dalegends/assets/animSkins_Weapons_2h_Axes.swf: 50
- reference/dalegends/assets/animSkins_Weapons_2h_Swords.swf: 38
- reference/dalegends/assets/animSkins_Weapons_bow.swf: 46
- reference/dalegends/assets/animSkins_Weapons_crossbows.swf: 50
- reference/dalegends/assets/animSkins_Weapons_daggers.swf: 35
- reference/dalegends/assets/animSkins_Weapons_dual.swf: 30
- reference/dalegends/assets/animSkins_Weapons_staves.swf: 50
- reference/dalegends/assets/animSkins_Weapons_Winter.swf: 5
- reference/dalegends/assets/FencingRoom.swf: 8
- reference/dalegends/assets/QuestIcons.swf: 2
- reference/dalegends/assets/TrainingRoom.swf: 3

By set:
- ANIMATION_ANIM_SKINS_MONSTERS_BIPED.xml: 43
- ANIMATION_ANIM_SKINS_MONSTERS_SKIRT.xml: 26
- ANIMATION_ANIM_SKINS_WEAPONS.xml: 468
- ANIMATION_ANIM_SKINS.xml: 40

By slot:
- weapon: 491
- weaponR: 43
- weaponShot: 42

By race/gender:
- UNRESTRICTED / UNRESTRICTED: 538

By reference status:
- REFERENCED: 538

## Player head components by race/gender

By source SWF:
- reference/dalegends/DALFlashApp.swf: 130

By set:
- CompositeHead: 130

By slot:
- head: 130

By race/gender:
- DWARF / FEMALE: 22
- DWARF / MALE: 14
- ELF / FEMALE: 3
- ELF / MALE: 20
- HUMAN / FEMALE: 23
- HUMAN / MALE: 28
- NPC / N/A: 20

By reference status:
- REFERENCED: 130

The runtime defines `hf_` Human female, `hm_` Human male, `ef_` Elf female, `em_` Elf male, `df_` Dwarf female, and `dw_` Dwarf male. It does not use a `dm_` dwarf-male prefix. These branches, non-identity hair selector maps, and face overrides are direct decompiled statements in `reference/dalegends/DALFlashApp.swf#com.ea2d.dal.display.character.CompositeHead`.

## Modular creatures

By source SWF:
- reference/dalegends/assets/anims_HumanoidMob_SPEAR.swf: 16
- reference/dalegends/assets/animSkins_HumanElf_NPC.swf: 51
- reference/dalegends/assets/animSkins_HumanElf_Robe_PromoB.swf: 1
- reference/dalegends/assets/animSkins_HumanElf_Vanity_B.swf: 17
- reference/dalegends/assets/animSkins_Monsters_ArcaneHorror.swf: 90
- reference/dalegends/assets/animSkins_Monsters_Biped_Journeys.swf: 111
- reference/dalegends/assets/animSkins_Monsters_Biped.swf: 87
- reference/dalegends/assets/animSkins_Monsters_CartaDwarves.swf: 306
- reference/dalegends/assets/animSkins_Monsters_CircleMages.swf: 216
- reference/dalegends/assets/animSkins_Monsters_Corpse_Normal.swf: 51
- reference/dalegends/assets/animSkins_Monsters_Coterie.swf: 363
- reference/dalegends/assets/animSkins_Monsters_CultistMages.swf: 216
- reference/dalegends/assets/animSkins_Monsters_Genlock.swf: 54
- reference/dalegends/assets/animSkins_Monsters_golem_corruptedDwarf.swf: 48
- reference/dalegends/assets/animSkins_Monsters_Golem_Humanoid.swf: 105
- reference/dalegends/assets/animSkins_Monsters_Golem_Mage.swf: 30
- reference/dalegends/assets/animSkins_Monsters_Golem.swf: 168
- reference/dalegends/assets/animSkins_Monsters_Hurlock_Alpha.swf: 17
- reference/dalegends/assets/animSkins_Monsters_Hurlock_Assassin.swf: 68
- reference/dalegends/assets/animSkins_Monsters_Hurlock_Axeman.swf: 68
- reference/dalegends/assets/animSkins_Monsters_Hurlock_Baker.swf: 16
- reference/dalegends/assets/animSkins_Monsters_Hurlock_Bolter.swf: 68
- reference/dalegends/assets/animSkins_Monsters_Hurlock_Commander.swf: 68
- reference/dalegends/assets/animSkins_Monsters_Hurlock_Mages.swf: 130
- reference/dalegends/assets/animSkins_Monsters_Hurlock_Normal.swf: 68
- reference/dalegends/assets/animSkins_Monsters_Hurlock_Sapper.swf: 68
- reference/dalegends/assets/animSkins_Monsters_Hurlock.swf: 74
- reference/dalegends/assets/animSkins_Monsters_Mabari.swf: 231
- reference/dalegends/assets/animSkins_Monsters_Multiped.swf: 6
- reference/dalegends/assets/animSkins_Monsters_Ogre.swf: 69
- reference/dalegends/assets/animSkins_Monsters_Qunari.swf: 192
- reference/dalegends/assets/animSkins_Monsters_Raiders.swf: 488
- reference/dalegends/assets/animSkins_Monsters_ShadeRageDemons.swf: 75
- reference/dalegends/assets/animSkins_Monsters_Shriek.swf: 19
- reference/dalegends/assets/animSkins_Monsters_Skeleton_Archer.swf: 68
- reference/dalegends/assets/animSkins_Monsters_Skeleton_Assassin.swf: 68
- reference/dalegends/assets/animSkins_Monsters_Skeleton_Axeman.swf: 68
- reference/dalegends/assets/animSkins_Monsters_Skeleton_Bolter.swf: 51
- reference/dalegends/assets/animSkins_Monsters_Skeleton_Commander.swf: 68
- reference/dalegends/assets/animSkins_Monsters_Skeleton_Normal.swf: 68
- reference/dalegends/assets/animSkins_Monsters_Skeleton_Sapper.swf: 68
- reference/dalegends/assets/animSkins_Monsters_Skirt.swf: 49
- reference/dalegends/assets/animSkins_Monsters_Spirit_Corrupted.swf: 237
- reference/dalegends/assets/animSkins_Monsters_Sylvan_RottingStorm.swf: 144
- reference/dalegends/assets/animSkins_Monsters_Sylvan.swf: 144
- reference/dalegends/assets/animSkins_Monsters_taintedElves.swf: 402
- reference/dalegends/assets/animSkins_Monsters_Templar.swf: 306
- reference/dalegends/assets/animSkins_Monsters_Werewolf.swf: 204
- reference/dalegends/assets/animSkins_Monsters_Wolves.swf: 42
- reference/dalegends/assets/animSkins_Qunari.swf: 32
- reference/dalegends/assets/ProTip_Character2.swf: 1
- reference/dalegends/assets/QuestIcons.swf: 8

By set:
- ANIMATION_ANIM_SKINS_MONSTERS_BIPED.xml: 4411
- ANIMATION_ANIM_SKINS_MONSTERS_MULTIPED.xml: 779
- ANIMATION_ANIM_SKINS_MONSTERS_SKIRT.xml: 532
- ANIMATION_ANIM_SKINS_ROBE.xml: 3
- ANIMATION_ANIM_SKINS.xml: 17

By slot:
- abdomen: 3
- armForeL: 287
- armForeR: 287
- armL: 1
- armR: 1
- armUpperL: 288
- armUpperR: 288
- backFootFar: 22
- backFootNear: 22
- backShinFar: 27
- backShinNear: 27
- backThighFar: 27
- backThighNear: 27
- backToesFar: 25
- backToesFar1: 2
- backToesFar2: 1
- backToesFar3: 1
- backToesNear: 25
- backToesNear1: 2
- backToesNear2: 1
- backToesNear3: 1
- blueFire: 1
- body: 22
- brokHorn: 4
- cape: 4
- chest: 277
- chestfireball: 3
- cloak: 4
- collar: 4
- collarBack: 1
- collarFront: 5
- crossBow: 2
- crossBowShot: 2
- fingersL: 6
- fingersR: 6
- footL: 268
- footR: 268
- foreArmFar: 27
- foreArmNear: 27
- foreFingersNear: 3
- foreHandNear: 2
- forePawFar: 25
- forePawFar1: 2
- forePawFar2: 1
- forePawFar3: 1
- forePawNear: 25
- forePawNear1: 2
- forePawNear2: 1
- forePawNear3: 1
- foreShoulderFar: 27
- foreShoulderNear: 27
- hackles: 19
- handL: 299
- handL1: 4
- handL2: 20
- handR: 299
- handR1: 4
- handR2: 4
- head: 329
- head2: 45
- head3: 21
- head4: 19
- hips: 244
- leftArmL: 16
- legEnd1Far: 3
- legEnd1Near: 3
- legEnd2Far: 3
- legEnd2Near: 3
- legEnd3Far: 3
- legEnd3Near: 3
- legEnd4Far: 3
- legEnd4Near: 3
- legMid1Far: 3
- legMid1Near: 3
- legMid2Far: 3
- legMid2Near: 3
- legMid3Far: 3
- legMid3Near: 3
- legMid4Far: 3
- legMid4Near: 3
- legUpper1Far: 3
- legUpper1Near: 3
- legUpper2Far: 3
- legUpper2Near: 3
- legUpper3Far: 3
- legUpper3Near: 3
- legUpper4Far: 3
- legUpper4Near: 3
- lowerArmR: 16
- lowerbody: 12
- midTorso: 16
- neck: 55
- neckRing: 4
- pelvis: 16
- shinL: 272
- shinR: 272
- shoulderL: 27
- shoulderR: 22
- skirt: 38
- skirtAir: 25
- skirtGradient: 31
- tail: 8
- tasset: 2
- tassetBack: 164
- tassetRag: 4
- thighL: 272
- thighR: 272
- thorax: 3
- torso: 18
- trail: 6
- undies: 4
- upperArmL: 16
- upperArmR: 16
- upperbody: 6
- upperTorso: 16
- waist: 262

By race/gender:
- UNRESTRICTED / UNRESTRICTED: 5683

By reference status:
- REFERENCED: 5683

## Self-contained creatures

No `SELF_CONTAINED_BAKED` classification has the required rig dependency-closure and absent-modular-skin proof. The **0** verified rows in this section therefore do not contribute to the modular total; **656** ambiguous character classes are explicit `UNPROVEN_BAKED_OR_MODULAR_CREATURE` records in `unknowns`, with `reference/dalegends/data/CHARACTER_CHARCLASS.xml#Entry[Type]` evidence.

## Orphans

- None

## Missing references

- None

## Unknowns

The raw skin-SWF audit closes 11997 non-`MainTimeline` exports. 628 physical exports lack a proven data-to-rig relationship; 1,415 expected contexts lack reachability proof; and 656 character classes lack the rig dependency-closure proof required for baked/modular classification. None are guessed into a modular category.

## Character Creator Assembly Findings

The extracted `CompositeHead` runtime implements six race/gender builders, while the public creator UI exposes Human male/female choices. Normal layer order is `hair_back → headSkin → nested facial_hair → eyes → hair → ears`. Hair and skin use separate `HeadTint` tables; eyes and composite face overrides bypass normal tinting. Evidence: `reference/dalegends/DALFlashApp.swf#com.ea2d.dal.display.character.CompositeHead`; component-specific evidence is retained in `player_head_components` and `character_creator_findings`.

## Completeness and queue readiness

The evidence is sufficient to define a source-qualified remaster queue for every classified symbol and to reconcile it against the remaining explicit `UNKNOWN` and `MISSING_SYMBOL` rows. The reconciliation method is the raw `SymbolClassTag` census in each listed `reference/dalegends/assets/animSkins*.swf` compared with the canonical identities and unknown records. It is sufficient to reconstruct the runtime’s composite-head component selection and tint behavior; the JSON preserves every unresolved creature relationship as `UNKNOWN` rather than claiming a baked/modular classification without the proof described above.
