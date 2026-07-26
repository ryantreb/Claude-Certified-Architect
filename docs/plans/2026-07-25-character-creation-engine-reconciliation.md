# Character Creation Engine Inventory Reconciliation

## Evidence boundary

- Authoritative inventory: `docs/visual-remaster/inventory/modular-skins-inventory.json`
- Human-readable findings: `docs/visual-remaster/inventory/modular-skins-inventory.md`
- Plan under review: `docs/plans/2026-07-25-character-creation-engine.md`
- Inventory schema version: `1.0.0`
- Inventory generated at: `2026-07-25T17:39:37.262Z`
- Inventory source baseline: 438 SHA-256-censused SWF/XML/CSV/JS sources. Identity is `source_path::exact_export_name`; generated names retain their physical `SymbolClassTag` evidence. See inventory `methodology` and `sources`.

The inventory, not the exploratory scripts or the plan itself, is the evidence boundary for this review. `INFERRED` rows are accepted only where their derivation is retained in the inventory; an absent mapping is not reconstructed from naming conventions.

## Status definitions

- `MATCH`: the plan assertion agrees with verified inventory evidence.
- `CONTRADICTION`: verified inventory evidence disproves or changes the assertion.
- `UNSUPPORTED`: the assertion lacks sufficient direct evidence.
- `BLOCKED_BY_UNKNOWN`: inventory evidence is unresolved and implementation would require guessing.
- `OUT_OF_SCOPE`: the assertion does not affect the original Human creator implementation.

## Reconciliation table

| ID | Plan section/assertion | Inventory evidence | Status | Severity | Required disposition |
|---|---|---|---|---|---|
| R01 | Recovered original behavior (lines 48-50) and Scope decisions (141-143): public creator is Human-only, with male/female choices. | `character_creator_findings.caveats[0]` distinguishes the Human public edit screen from latent Elf/Dwarf assembly; `character_creator_findings.genders = [MALE, FEMALE]`. Runtime source: `DALFlashApp.swf#...CompositeHead`. | MATCH | NON_BLOCKER | KEEP |
| R02 | Recovered behavior (51-54), Scope decisions (141), and target contract (215-220): 6 face/`skinType`, 12 `hairType`, and exposed color selectors 0-8. | `character_creator_findings.selector_bounds.human = {skin_types: 6, hair_types: 12}` from `CHARACTER_RACE.xml`; `character_creator_findings.tint.{skin_colors,hair_colors}` supplies indices 0-9, with index 9 `[0,0]` as internal no-tint. | MATCH | NON_BLOCKER | KEEP |
| R03 | Recovered assets (107-112): six Human male and female `headSkin` exports and fixed Human eyes. | Verified `player_head_components` keys: `DALFlashApp.swf::{hf,hm}_headSkin`, `_2` through `_6`, and `{hf,hm}_eyes`; each has a `CompositeHead` constructor locator. | MATCH | NON_BLOCKER | KEEP |
| R04 | Task 1 / compiler spec (323-327, 526-528): exact front-hair selector-to-symbol maps, including male hair 8 as bald. | All candidate front-hair components are inventoried, including `hf_hair_1..12` and `hm_hair_1..13`, but their `selector_values` are null. The inventory contains no verified `hairType -> symbol_key` mapping and does not identify which male choice is bald. | BLOCKED_BY_UNKNOWN | BLOCKER | DEFER exact maps and bald assertion until the inventory records the `CompositeHead` branch mapping. Do not implement from names or exploratory scripts. |
| R05 | Recovered assets (111, 114) and compiler spec (527): each hair choice's exact rear-hair mapping. | Verified Human rear candidates are `hf_hair_{2,6,7,11}_back` and `hm_hair_{7,9,10}_back`; all have `role: hair_back`, but no selector values or front/rear pair links. | BLOCKED_BY_UNKNOWN | BLOCKER | DEFER the rear-hair map; add a verified mapping table keyed by `hairType` before extraction. |
| R06 | Recovered assets (112), Task 1 (324), and acceptance criteria (1229): male face types 2-6 map to `hm_facial_1..5`. | The five verified component identities are `DALFlashApp.swf::hm_facial_1..5`, `role: facial_hair`, `selector_field: skinType`, and `tintable: yes`. Their individual `skinType` selector values are absent. | BLOCKED_BY_UNKNOWN | BLOCKER | DEFER the claimed 2-6 mapping; preserve the verified component set only. |
| R07 | Recovered assets (114) and head compiler task: bottom-to-top order is rear hair -> skin/beard -> eyes -> front hair. | `character_creator_findings.layer_order` is `hair_back, headSkin, facial_hair nested on headSkin, eyes, hair, ears`. | CONTRADICTION | BLOCKER | EDIT the executable layer contract to include the verified terminal `ears` layer, or document a verified Human-specific exclusion. |
| R08 | Recovered assets (114-123), runtime head task (737-742), and tests: skin tint applies to face; hair tint applies to both hair layers and beard; eyes remain untinted; Flash mix is 0.5. | `character_creator_findings.tint` verifies both palettes including the `[color, 0.5]` coefficients; `eyes: no tint`; Human hair, rear-hair, facial-hair, and headSkin rows state `tintable: yes`. | MATCH | NON_BLOCKER | KEEP |
| R09 | Recovered assets (75), Historical prototype (133-137), and later comparison tests: four male/four female preset component mappings are a source-faithful comparison target. | `CHARACTER_PRESET.xml` is a census source, but the inventory has no normalized preset records or exact preset -> component links. | UNSUPPORTED | NON_BLOCKER | REMOVE preset-component comparison from the inventory-backed compiler contract, or add it to the inventory with direct XML evidence. |
| R10 | Recovered assets (77, 88-95), compiler spec (528), and rig tasks: Warrior/Rogue/Mage starting equipment maps to specific Basic/Standard skins. | Basic sources and inferred XML piece links are present: `animSkins_HumanElf_{Heavy,Leather,Robe}_Basic.swf`; for example, `...Heavy_Basic.swf::quartzArmor_m_waist` links to `skHvStarterMetalArmor1`. There is no normalized `class -> starter skin` relation in a row. | UNSUPPORTED | BLOCKER | DEFER class-to-equipment selection until the inventory records the `CHARACTER_CHARCLASS.xml` relationship and exact skin IDs. |
| R11 | Recovered assets (78, 92-95), compiler spec (528), and rig tasks: class/equipment -> weapon family -> HumanElf animation rig mapping. | Weapon sources are inventoried and referenced, but `weapons[].rig_ids` is empty for the relevant rows. No inventory relation joins class, selected weapon, and `ANIMATION_ANIM_RIGS.xml` rig. | BLOCKED_BY_UNKNOWN | BLOCKER | DEFER generated rig selection and the twelve-rig manifest claim until this relationship is inventoried. |
| R12 | Recovered assets (88-91) and acceptance criteria (1231): Basic and Standard Human equipment sources drive switching. | The three Basic source SWFs are verified; report source counts also list the matching Heavy/Leather/Robe Standard SWFs. Basic rows carry source-SWF identity and inferred XML provenance. | MATCH | NON_BLOCKER | KEEP source-qualified identities; never collapse duplicate export names. |
| R13 | Recovered assets (97) and split-rig design (264-281): named body attachment slots include head, helmet, helmetBack, weapon, bow, and skirt. | `body_and_equipment_skins[].intended_rig_slots` verifies `head`, `helmet`, `helmetBack`, and `skirt`; `weapons[].intended_rig_slots` verifies `weapon` and `weaponR`/`weaponShot`. The inventory does not link those slots to a Human rig timeline's display-list ordering or matrix. | UNSUPPORTED | BLOCKER | DEFER headless-rig splitting and matrix extraction until the inventory adds exact Human rig placements and ordering. |
| R14 | Recovered assets (125-131): creator panels are character IDs 1810/1536 and supporting IDs 1766, 1782-1785, 1809. | Human head rows preserve SWF character IDs, but the inventory has no creator-UI-symbol classification or those panel identities. | UNSUPPORTED | NON_BLOCKER | REMOVE these IDs from the evidence-backed compiler spec; keep them only as an exploratory visual-reference note. |
| R15 | Scope, save, Tailnet delivery, service worker, DOM layout, and learning invariants throughout the plan. | These are application and delivery requirements, not modular-asset assertions; no inventory relationship contradicts them. | OUT_OF_SCOPE | NON_BLOCKER | KEEP outside this evidence gate. |
| R16 | Recovered assets (98-104): `compose2.js`, `headskin*.js`, `hero_pipeline.js`, and `batch18.js` are useful ground truth for composition. | Inventory `methodology` names SWF/XML/runtime extraction as canonical; it does not cite these scripts as evidence. | UNSUPPORTED | BLOCKER | REMOVE scripts as a source of production facts. Their assertions must be re-extracted into verified inventory fields first. |
| R17 | Any implementation that assumes all creator-relevant sources are resolved. | `unknowns` has 2,699 rows: 628 `UNCLASSIFIED_SKIN_SWF_EXPORT`, 1,415 `UNPROVEN_REACHABLE_CONTEXT`, and 656 creature-only `UNPROVEN_BAKED_OR_MODULAR_CREATURE`. There are no `missing_symbols`. The first two groups include Human/creator/weapon/rig keyword matches. | BLOCKED_BY_UNKNOWN | BLOCKER | Add exact creator relevance/exclusions for each candidate unknown before the compiler treats inventory coverage as closed. |
| R18 | Any implementation that identifies a source asset by export name alone. | `methodology.identity_rule` and `summary.duplicate_name_across_swf_count = 97` require `source_path::exact_export_name`; source duplicates remain separate identities. | MATCH | NON_BLOCKER | KEEP and make `symbol_key`, not bare names, the build input. |

## Human creator-reachable component audit

The following explicit groups cover every inventory row where `race = HUMAN` and `creator_reachable = true`; all identities are in `reference/dalegends/DALFlashApp.swf` and each has verified `CompositeHead` constructor evidence.

| Group | Covered symbol keys | Reconciliation row |
|---|---|---|
| Female face and eyes | `hf_headSkin`, `hf_headSkin_2..6`, `hf_eyes` | R03, R08 |
| Male face and eyes | `hm_headSkin`, `hm_headSkin_2..6`, `hm_eyes` | R03, R08 |
| Female front hair | `hf_hair_1..12` | R04, R08 |
| Male front hair | `hm_hair_1..13` | R04, R08 |
| Female rear hair | `hf_hair_2_back`, `hf_hair_6_back`, `hf_hair_7_back`, `hf_hair_11_back` | R05, R08 |
| Male rear hair | `hm_hair_7_back`, `hm_hair_9_back`, `hm_hair_10_back` | R05, R08 |
| Male facial hair | `hm_facial_1..5` | R06, R08 |

This audit also exposes the mismatch that must be resolved: the 12-choice selector contract cannot be proven from a component list that includes 13 male front-hair exports and has no selector values.

## Creator-relevant blockers

1. The exact `hairType` front/rear mappings, male bald mapping, and male facial-hair coupling are not recorded by the authoritative inventory (R04-R06).
2. The verified layer sequence includes `ears`, absent from the plan's executable composition order (R07).
3. Class-to-starter-equipment and class/equipment-to-weapon-to-rig closure are not normalized (R10-R11).
4. The inventory does not prove Human rig placements/display-list order/matrices needed to split back and front atlases (R13).
5. Creator-relevant unknown candidates have not been expressly included or excluded (R17).
6. The plan still treats exploratory scripts as ground truth even though the inventory does not (R16).

## Required plan edits

No implementation-plan edit is made in this issue, by design. Before the next gate, update the plan to:

- consume `symbol_key` identities and the inventory as its sole asset-evidence boundary;
- include `ears` in the proven composition order or document a verified Human exclusion;
- delete or defer every selector, class/equipment/weapon/rig, and timeline-placement assertion marked BLOCKER above;
- remove exploratory scripts as proof; and
- require an inventory validation failure when relevant unknowns lack an explicit evidence-backed exclusion.

## Non-blocking findings

- Human-only public scope, binary gender, six faces, twelve hair choices, and the two exposed nine-color palettes agree with the inventory.
- The exact Human `headSkin`, eyes, hair, rear-hair, and facial-hair component identities are verified from the main SWF.
- Basic and Standard equipment source families exist with source-qualified identity.
- There are no inventory `missing_symbols`; 97 duplicate export names reinforce the need for source-qualified lookup.
- UI, networking, cache policy, save compatibility, and learning-state protections require normal implementation review but are outside asset reconciliation.

## Reconciliation conclusion

The evidence boundary is sufficient to preserve the Human component inventory and palette bounds, but it is not sufficient to execute a source-faithful modular creator. Gate 2 therefore fails: R04-R07, R10-R11, R13, R16, and R17 are creator-relevant blockers. The implementation plan remains unchanged, as required; the next authorized work is to enrich and revalidate the inventory, not to repair the plan or runtime.
