# Dragon Age Legends Character Creator Evidence-to-Implementation Program Implementation Plan

**Goal:** Sequentially complete the canonical modular-asset inventory, reconcile its evidence with the existing character-creator plan, correct that plan, and then implement the verified original Human character creator without relying on conversational memory.

**Architecture:** Treat the inventory JSON as the authoritative evidence boundary and the character-creator plan as a downstream consumer. Four hard gates enforce the order: finish and validate the inventory, record every match or discrepancy, revise the creator plan until no creator-relevant blocker remains, and only then execute the revised implementation plan. Git commits and durable repository files provide restart points between phases.

**Tech Stack:** Markdown execution plans, JSON, `jq`, Node.js 20, Java 21, JPEXS Free Flash Decompiler 26.2.1, Git, the repository's existing JavaScript/Python build tools, Sharp, and Playwright

---

## Program inputs and outputs

Run all work from:

```text
/home/ryantreb/Claude-Certified-Architect
```

The two child plans are:

```text
docs/plans/2026-07-25-dragon-age-legends-modular-skins-inventory.md
docs/plans/2026-07-25-character-creation-engine.md
```

This program must produce or update:

```text
docs/visual-remaster/inventory/modular-skins-inventory.json
docs/visual-remaster/inventory/modular-skins-inventory.md
docs/plans/2026-07-25-character-creation-engine-reconciliation.md
docs/plans/2026-07-25-character-creation-engine.md
```

Task 4 executes only the revised plan's approved inventory/compiler/audit scope.
It must not produce source-faithful creator assets while its deferred-evidence
table is nonempty.

## Sequential execution contract

Complete Tasks 1–4 strictly in order. Do not run the inventory and creator implementation plans in parallel.

The gates are:

1. **Inventory gate:** both inventory deliverables exist, their counts agree, the JSON validator passes, and protected original assets are unchanged.
2. **Reconciliation gate:** every creator-plan assertion is classified as `MATCH`, `CONTRADICTION`, `UNSUPPORTED`, `BLOCKED_BY_UNKNOWN`, or `OUT_OF_SCOPE`, with evidence.
3. **Plan-readiness gate:** every creator-relevant blocker is either backed by evidence or explicitly deferred outside executable scope.
4. **Implementation gate:** only the revised plan's approved acceptance suite passes without invalidating the inventory evidence. Source-faithful implementation is a later gate, after the deferred-evidence table is empty and the plan is reapproved.

Never bypass a failed gate because the downstream plan appears plausible.

## Restart and resume protocol

At the beginning of every resumed session, run:

```bash
git status --short
git log --oneline --decorate -12
test -f docs/plans/2026-07-25-dragon-age-legends-modular-skins-inventory.md
test -f docs/plans/2026-07-25-character-creation-engine.md
```

Then determine the first incomplete gate:

```bash
test -s docs/visual-remaster/inventory/modular-skins-inventory.json \
  && jq empty docs/visual-remaster/inventory/modular-skins-inventory.json \
  && echo "inventory artifact exists"

test -s docs/plans/2026-07-25-character-creation-engine-reconciliation.md \
  && echo "reconciliation artifact exists"

rg -n '^## Authoritative inventory prerequisite$' \
  docs/plans/2026-07-25-character-creation-engine.md || true
```

File existence is only a resume hint. Re-run the relevant gate checks before advancing.

Preserve all unrelated user changes. In particular, do not stage files merely because they are present under `docs/plans/`.

### Task 1: Execute and validate the modular-skins inventory plan

**Files:**
- Read and execute: `docs/plans/2026-07-25-dragon-age-legends-modular-skins-inventory.md`
- Create: `docs/visual-remaster/inventory/modular-skins-inventory.json`
- Create: `docs/visual-remaster/inventory/modular-skins-inventory.md`
- Do not modify: `reference/dalegends/**/*.swf`
- Do not modify: `reference/dalegends/data/**/*.xml`
- Do not modify: runtime, artwork, baselines, or generated game files

**Step 1: Record the pre-inventory boundary**

Run:

```bash
git rev-parse HEAD
git branch --show-current
git status --short
find reference/dalegends/assets -maxdepth 1 -type f -name 'animSkins*.swf' | sort | wc -l
find reference/dalegends/assets -maxdepth 1 -type f -name 'anims*.swf' | sort | wc -l
find reference/dalegends/data -maxdepth 1 -type f -name 'ANIMATION_ANIM_SKINS*.xml' | sort | wc -l
```

Expected at the planning baseline:

```text
105 animSkins SWFs
182 anims SWFs
15 ANIMATION_ANIM_SKINS XML files
```

If the counts differ, follow the inventory plan's changed-source procedure before continuing. Do not reuse stale counts or a stale extraction.

**Step 2: Execute the inventory child plan completely**

Use `@executing-plans` to execute:

```text
docs/plans/2026-07-25-dragon-age-legends-modular-skins-inventory.md
```

Complete all twelve tasks in that plan, including:

- complete physical SWF and embedded-manifest source discovery;
- lossless `SymbolClass` and `ExportAssets` extraction;
- XML/runtime relationship reconstruction;
- exact runtime symbol-name generation;
- body, equipment, weapon, head, modular-creature, and baked-creature classification;
- SWF → data orphan reconciliation;
- data → SWF missing-symbol reconciliation;
- duplicate and alias analysis;
- JSON validation;
- Markdown generation from the validated JSON;
- protected-file and final-integrity checks.

Do not begin Task 2 of this meta-plan while any child-plan task remains incomplete.

**Step 3: Verify the authoritative JSON contract**

Run:

```bash
jq empty docs/visual-remaster/inventory/modular-skins-inventory.json
jq -e '
  has("summary") and
  has("sources") and
  has("rigs") and
  has("body_and_equipment_skins") and
  has("weapons") and
  has("player_head_components") and
  has("creature_modular_skins") and
  has("self_contained_creatures") and
  has("orphan_symbols") and
  has("missing_symbols") and
  has("unknowns") and
  has("character_creator_findings")
' docs/visual-remaster/inventory/modular-skins-inventory.json
```

Expected: both commands exit 0 and the second prints `true`.

**Step 4: Capture the inventory gate counts**

Run:

```bash
jq '{
  schema_version,
  generated_at,
  summary,
  body_and_equipment_rows: (.body_and_equipment_skins | length),
  weapon_rows: (.weapons | length),
  head_component_rows: (.player_head_components | length),
  modular_creature_rows: (.creature_modular_skins | length),
  self_contained_creature_rows: (.self_contained_creatures | length),
  orphan_rows: (.orphan_symbols | length),
  missing_rows: (.missing_symbols | length),
  unknown_rows: (.unknowns | length)
}' docs/visual-remaster/inventory/modular-skins-inventory.json
```

Expected: the printed counts match the Markdown BLUF exactly. Counts do not need to be zero, but every missing or unknown row must contain explicit evidence about what remains unresolved.

**Step 5: Verify creator findings exist**

Run:

```bash
jq -e '
  (.player_head_components | length) > 0 and
  (.character_creator_findings | type) == "object" and
  (.character_creator_findings | length) > 0
' docs/visual-remaster/inventory/modular-skins-inventory.json

rg -n '^## Character Creator Assembly Findings$' \
  docs/visual-remaster/inventory/modular-skins-inventory.md
```

Expected: `jq` prints `true`, and `rg` locates the required Markdown section.

**Step 6: Re-run the inventory plan's validator**

Use the validator and exact validation commands created by Task 10 of the inventory plan.

At minimum, run:

```bash
jq empty docs/visual-remaster/inventory/modular-skins-inventory.json
node /tmp/dal-modular-skins-inventory-work-27079eb/validate-inventory.mjs
```

If the temporary validator is absent in a resumed session, recreate it exactly as specified in the inventory plan before advancing. Do not substitute a syntax-only check.

Expected: the validator exits 0 and prints the same final count object recorded in Step 4.

**Step 7: Verify protected sources stayed unchanged**

Run:

```bash
git status --short -- reference/dalegends index.html mobile tests
git diff --stat -- reference/dalegends index.html mobile tests
```

Expected: no inventory-phase modifications under those paths.

**Step 8: Record the inventory gate**

Run:

```bash
git log --oneline --decorate -8
git status --short
```

Expected: the inventory JSON and Markdown are committed in the logical documentation commits required by the child plan. Preserve unrelated untracked files.

Gate 1 passes only after Steps 3–8 pass.

### Task 2: Reconcile the character-creation plan against the inventory

**Files:**
- Read: `docs/visual-remaster/inventory/modular-skins-inventory.json`
- Read: `docs/visual-remaster/inventory/modular-skins-inventory.md`
- Read: `docs/plans/2026-07-25-character-creation-engine.md`
- Create: `docs/plans/2026-07-25-character-creation-engine-reconciliation.md`
- Do not modify yet: `docs/plans/2026-07-25-character-creation-engine.md`
- Do not modify: runtime, tests, generated assets, or original source assets

**Step 1: Extract the creator-relevant evidence**

Create an OS temporary directory:

```bash
export DAL_CREATOR_RECON_DIR
DAL_CREATOR_RECON_DIR="$(mktemp -d /tmp/dal-creator-reconciliation.XXXXXX)"
printf '%s\n' "$DAL_CREATOR_RECON_DIR"
```

Write the following bounded views:

```bash
jq '{
  summary,
  character_creator_findings,
  player_head_components,
  relevant_missing_symbols: [
    .missing_symbols[]
    | select(
        ((.race_restrictions // []) | index("HUMAN")) or
        ((.class_restrictions // []) | length > 0) or
        ((.notes // []) | tostring | test("creator|Human|head|hair|face|Warrior|Rogue|Mage"; "i"))
      )
  ],
  relevant_unknowns: [
    .unknowns[]
    | select(tostring | test("creator|Human|head|hair|face|Warrior|Rogue|Mage|weapon|rig"; "i"))
  ]
}' docs/visual-remaster/inventory/modular-skins-inventory.json \
  > "$DAL_CREATOR_RECON_DIR/creator-evidence.json"

jq '[
  .body_and_equipment_skins[]
  | select(
      ((.race_restrictions // []) | length == 0) or
      ((.race_restrictions // []) | index("HUMAN"))
    )
  | select(
      ((.class_restrictions // []) | length == 0) or
      ((.class_restrictions // []) | any(. == "WARRIOR" or . == "ROGUE" or . == "MAGE"))
    )
]' docs/visual-remaster/inventory/modular-skins-inventory.json \
  > "$DAL_CREATOR_RECON_DIR/human-equipment.json"

jq '[
  .weapons[]
  | select(
      ((.class_restrictions // []) | length == 0) or
      ((.class_restrictions // []) | any(. == "WARRIOR" or . == "ROGUE" or . == "MAGE"))
    )
]' docs/visual-remaster/inventory/modular-skins-inventory.json \
  > "$DAL_CREATOR_RECON_DIR/creator-weapons.json"
```

Expected: all three files parse with `jq empty`. If the final inventory uses different restriction enum spelling, inspect the actual values and adjust only the filters—not the inventory.

**Step 2: Inventory every implementation-plan assertion**

Inspect these sections of the character-creation plan:

```bash
rg -n \
  'Recovered original behavior|Recovered original assets and data|Scope decisions|Target data contracts|Define the compiler specification|Extract origin-preserving head vectors|Build gendered headless class rigs|Split, validate, and pack|Acceptance criteria' \
  docs/plans/2026-07-25-character-creation-engine.md
```

Build one reconciliation row for every assertion in these categories:

1. public creator race and gender availability;
2. `skinType`, `hairType`, `skinColor`, and `hairColor` selector bounds;
3. exact Human male and female head export names;
4. SWF character IDs;
5. hair selector → front-hair symbol mapping;
6. hair selector → rear-hair symbol mapping;
7. male face → facial-hair coupling;
8. bottom-to-top head layer order;
9. component-specific tint behavior and palette indices;
10. preset → exact component mapping;
11. class → initial equipment skin mapping;
12. class/equipment → weapon family → animation rig mapping;
13. Basic/Standard body/equipment source SWFs;
14. named head, helmet, helmet-back, weapon, bow, and skirt attachment slots;
15. creator-relevant missing symbols, aliases, or unknowns;
16. claims based only on exploratory scripts or `reference/dalegends/NOTES.md`.

Do not treat agreement between the old plan and an exploratory script as independent confirmation.

**Step 3: Create the durable reconciliation report**

Use `apply_patch` to create:

```text
docs/plans/2026-07-25-character-creation-engine-reconciliation.md
```

Start it with:

```markdown
# Character Creation Engine Inventory Reconciliation

## Evidence boundary

- Authoritative inventory: `docs/visual-remaster/inventory/modular-skins-inventory.json`
- Human-readable findings: `docs/visual-remaster/inventory/modular-skins-inventory.md`
- Plan under review: `docs/plans/2026-07-25-character-creation-engine.md`
- Inventory schema version: `<copy from JSON>`
- Inventory generated at: `<copy from JSON>`
- Inventory source baseline: `<copy from inventory methodology/sources>`

## Status definitions

- `MATCH`: the plan assertion agrees with verified inventory evidence.
- `CONTRADICTION`: verified inventory evidence disproves or changes the assertion.
- `UNSUPPORTED`: the assertion lacks sufficient direct evidence.
- `BLOCKED_BY_UNKNOWN`: inventory evidence is unresolved and implementation would require guessing.
- `OUT_OF_SCOPE`: the assertion does not affect the original Human creator implementation.

## Reconciliation table

| ID | Plan section/assertion | Inventory evidence | Status | Severity | Required disposition |
|---|---|---|---|---|---|

## Creator-relevant blockers

## Required plan edits

## Non-blocking findings

## Reconciliation conclusion
```

Every table row must cite:

- the character-plan heading or line;
- the inventory JSON key and matching `symbol_key`, evidence locator, or finding key;
- status;
- severity `BLOCKER` or `NON_BLOCKER`;
- disposition `KEEP`, `EDIT`, `REMOVE`, or `DEFER`.

**Step 4: Apply strict status rules**

Use these rules:

- Mark `MATCH` only when the inventory evidence is `VERIFIED`, or when an `INFERRED` value is explicitly acceptable for the implementation and the derivation is preserved.
- Mark `CONTRADICTION` whenever exact symbol spelling, character ID, selector mapping, layer order, tint target, SWF source, rig slot, or data relationship differs.
- Mark `UNSUPPORTED` when the plan makes a claim not represented by direct inventory evidence.
- Mark `BLOCKED_BY_UNKNOWN` when implementation would have to guess a source symbol or relationship.
- Mark creator UI layout, Tailnet delivery mechanics, cache policy, and backward-compatibility requirements `OUT_OF_SCOPE` for this evidence comparison unless the inventory directly contradicts an asset assumption they depend on.
- Treat any creator-relevant `MISSING_SYMBOL` as a blocker unless the plan demonstrably does not use it.
- Treat creator-relevant aliases as non-blocking only when the plan preserves the exact `source_swf::symbol_name` identity.

**Step 5: Audit all head rows**

Run:

```bash
jq -r '
  .player_head_components[]
  | [
      .symbol_key,
      (.race // (.race_restrictions // []) | tostring),
      (.gender // (.gender_restrictions // []) | tostring),
      (.role // .piece_name // "UNKNOWN"),
      (.selector_values // [] | tostring),
      (.creator_reachable // false | tostring),
      (.tintable // "unknown")
    ]
  | @tsv
' docs/visual-remaster/inventory/modular-skins-inventory.json \
  | sort
```

Expected: every Human creator-reachable head component appears in the reconciliation table or is covered by an explicitly cited grouped row.

**Step 6: Audit all creator-relevant unresolved evidence**

Run:

```bash
jq '{
  missing: [
    .missing_symbols[]
    | select(tostring | test("creator|Human|head|hair|face|Warrior|Rogue|Mage|weapon|rig"; "i"))
  ],
  unknown: [
    .unknowns[]
    | select(tostring | test("creator|Human|head|hair|face|Warrior|Rogue|Mage|weapon|rig"; "i"))
  ]
}' docs/visual-remaster/inventory/modular-skins-inventory.json
```

Expected: each printed row has a corresponding reconciliation row and disposition.

**Step 7: Review the reconciliation without editing the implementation plan**

Run:

```bash
rg -n 'CONTRADICTION|UNSUPPORTED|BLOCKED_BY_UNKNOWN|BLOCKER|Required plan edits|Reconciliation conclusion' \
  docs/plans/2026-07-25-character-creation-engine-reconciliation.md

git diff -- docs/plans/2026-07-25-character-creation-engine.md
```

Expected: the report contains all discrepancies, while the character-creation plan has no Task 2 changes.

**Step 8: Commit the reconciliation report**

Run:

```bash
git add docs/plans/2026-07-25-character-creation-engine-reconciliation.md
git diff --cached --check
git commit -m "docs: reconcile creator plan with asset inventory"
```

Expected: the commit contains only the reconciliation report.

Gate 2 passes when the report covers every category in Step 2 and every relevant unresolved item in Step 6.

### Task 3: Update and approve the character-creation plan

**Files:**
- Modify: `docs/plans/2026-07-25-character-creation-engine.md`
- Read: `docs/plans/2026-07-25-character-creation-engine-reconciliation.md`
- Read: `docs/visual-remaster/inventory/modular-skins-inventory.json`
- Do not modify: runtime, tests, generated assets, or original source assets

**Step 1: Add the authoritative inventory prerequisite**

Use `apply_patch` to add this section after the character plan's introductory header:

```markdown
## Authoritative inventory prerequisite

This plan consumes `docs/visual-remaster/inventory/modular-skins-inventory.json`
as the authoritative source for original modular symbol identity, SWF provenance,
head selector mappings, layer order, tint behavior, equipment-skin relationships,
weapon families, and rig compatibility.

Before implementation, `docs/plans/2026-07-25-character-creation-engine-reconciliation.md`
must contain no unresolved creator-relevant blocker. Exact source assets are identified
by `source_swf::symbol_name`; duplicate export names from different SWFs must never be
silently merged.
```

Do not copy a generated timestamp into the implementation contract. Use the committed inventory file and its content as the durable boundary.

**Step 2: Apply every required reconciliation edit**

For every row whose disposition is `EDIT`, use `apply_patch` to replace the contradicted or unsupported statement with the verified value and its evidence source.

For every `REMOVE` row, remove the unsupported claim without removing a still-valid requirement.

For every `DEFER` row:

- remove the affected feature from executable scope;
- add it to a clearly labeled deferred/unknown section;
- ensure no later task or acceptance criterion still requires it.

Do not broaden the first implementation beyond the original public Human creator merely because the inventory includes Elf, Dwarf, NPC, or creature components.

**Step 3: Make the compiler consume the inventory contract**

Update the creator plan's compiler task so that:

- `tools/character-creator/spec.json` identifies
  `docs/visual-remaster/inventory/modular-skins-inventory.json` as its evidence source;
- the build tool reads the inventory at build/check time, never at browser runtime;
- exact required Human head symbols are validated by `symbol_key`, not export name alone;
- the selected armor and weapon pieces are validated against their source SWFs, rig slots, class restrictions, gender restrictions, and reference status;
- creator-relevant `MISSING_SYMBOL`, `UNKNOWN`, or `ORPHAN_OR_UNUSED` rows fail `--check` unless the spec contains an evidence-backed explicit exclusion;
- the generated creator manifest records the committed inventory schema version and a SHA-256 digest of the inventory bytes;
- `--verify-output` confirms that the generated manifest's inventory digest matches the current authoritative JSON;
- generated browser/mobile artifacts do not bundle the complete inventory unless explicitly required.

Replace any instruction that manually re-declares mappings without checking the inventory.

**Step 4: Correct source-evidence language**

Search:

```bash
rg -n 'ground truth|NOTES\\.md|exploratory|headskin|compose2|hero_pipeline|batch18' \
  docs/plans/2026-07-25-character-creation-engine.md
```

Revise the plan so that:

- canonical SWF/XML/runtime evidence and the validated inventory are authoritative;
- exploratory scripts may supply reusable algorithms or discovery hints;
- `reference/dalegends/NOTES.md` may be updated as documentation but is never cited as proof;
- assembled screenshots and flattened character frames are validation outputs, not source assets.

**Step 5: Preserve non-asset implementation decisions**

Do not rewrite valid decisions about:

- Human-only public creator scope;
- current champions remaining available;
- save compatibility;
- separation from learning-state/progression logic;
- lazy loading and bounded caches;
- split back/head/front rendering;
- Tailnet-only hosting;
- service-worker cache policy;
- mobile generation boundaries;
- accessibility and responsive behavior;
- test coverage.

Only change these if inventory evidence exposes a direct dependency conflict.

**Step 6: Resolve every blocker**

Run:

```bash
rg -n 'BLOCKED_BY_UNKNOWN|Severity.*BLOCKER|\\| BLOCKER \\|' \
  docs/plans/2026-07-25-character-creation-engine-reconciliation.md
```

For each result, confirm the updated plan does one of the following:

1. uses newly verified evidence;
2. removes the affected behavior from scope;
3. defers the behavior without leaving executable references;
4. stops the program and asks the user for direction because none of the above is faithful.

Do not convert an unknown into an assumption.

**Step 7: Add a reconciliation disposition section**

Append to the reconciliation report:

```markdown
## Final dispositions

| Reconciliation ID | Resolution in revised plan | Plan section | Status |
|---|---|---|---|

## Plan-readiness gate

- Unresolved creator-relevant blockers: 0
- Revised plan consumes the authoritative inventory: yes
- Exact symbol identity uses `source_swf::symbol_name`: yes
- Creator scope requires no missing or unknown source relationship: yes
```

Populate every row. Do not write zero blockers unless each blocker has a documented resolution.

**Step 8: Validate the revised plan**

Run:

```bash
rg -n '^## Authoritative inventory prerequisite$' \
  docs/plans/2026-07-25-character-creation-engine.md

rg -n 'docs/visual-remaster/inventory/modular-skins-inventory\\.json' \
  docs/plans/2026-07-25-character-creation-engine.md

rg -n 'source_swf::symbol_name|symbol_key|inventory digest|SHA-256' \
  docs/plans/2026-07-25-character-creation-engine.md

rg -n 'Unresolved creator-relevant blockers: 0' \
  docs/plans/2026-07-25-character-creation-engine-reconciliation.md

git diff --check -- \
  docs/plans/2026-07-25-character-creation-engine.md \
  docs/plans/2026-07-25-character-creation-engine-reconciliation.md
```

Expected: all searches find the revised contract and the diff check exits 0.

**Step 9: Re-run a claim audit**

Use `@verify-claims` to check:

- every exact symbol name and source SWF in the revised creator plan;
- every selector bound and mapping;
- all layer-order and tint claims;
- class/equipment/weapon/rig relationships;
- every statement that an asset exists and is creator-reachable.

Use only the authoritative inventory and its cited primary repository evidence. Fix any failed claim before advancing.

**Step 10: Commit the revised plans**

Run:

```bash
git add \
  docs/plans/2026-07-25-character-creation-engine.md \
  docs/plans/2026-07-25-character-creation-engine-reconciliation.md
git diff --cached --check
git diff --cached --stat
git commit -m "docs: ground creator implementation in verified inventory"
```

Expected: only the creator plan and its reconciliation report are committed.

Gate 3 passes only when the reconciliation report explicitly records zero unresolved creator-relevant blockers and the claim audit passes.

### Task 4: Execute only the approved inventory/compiler/audit contract

**Files:**
- Read: `docs/plans/2026-07-25-character-creation-engine.md`
- Read as authoritative evidence: `docs/visual-remaster/inventory/modular-skins-inventory.json`
- Read as review record: `docs/plans/2026-07-25-character-creation-engine-reconciliation.md`
- Modify/create/test: only tooling and metadata expressly authorized by the plan's **Approved executable scope**

**Step 1: Confirm the executable boundary**

Run:

```bash
jq empty docs/visual-remaster/inventory/modular-skins-inventory.json
rg -n 'Unresolved creator-relevant blockers: 0 in the approved executable scope' \
  docs/plans/2026-07-25-character-creation-engine-reconciliation.md
rg -n '^## Superseding acceptance criteria$|^### Deferred evidence work' \
  docs/plans/2026-07-25-character-creation-engine.md
```

Expected: the JSON parses and the approved/deferred boundary is present. Do not
run the plan's archived task sections.

**Step 2: Implement and check only the approved contract**

Implement the source-qualified inventory reader, `--check`, `--verify-output`,
digest metadata, and claim audit described by the superseding acceptance
criteria. It may not select or emit a full source-faithful Human creator bundle
until the deferred-evidence table is empty. Any consumed `UNKNOWN`,
`MISSING_SYMBOL`, or `ORPHAN_OR_UNUSED` row without evidence-backed exclusion
fails the check.

**Step 3: Stop for evidence enrichment before source-faithful implementation**

The presence of any deferred evidence workgroup blocks selector mapping,
composition, rig extraction, creator UI, asset delivery, creator visual QA, and
their archived tests. Enrich and validate the inventory, return to Task 2,
revise/approve the child plan in Task 3, and only then create a new implementation
gate. Do not turn a deferred relationship into a likely implementation choice.

**Step 4: Deliver the program-level report**

Report the inventory paths and counts, reconciliation dispositions, approved
contract test/check results, untouched original-source boundary, and every
remaining deferred relationship. State explicitly that a source-faithful Human
creator was not reconstructed while any deferred workgroup remains.

Gate 4 passes only when the approved compiler/audit acceptance criteria pass.
It does not authorize the archived source-faithful implementation draft.
