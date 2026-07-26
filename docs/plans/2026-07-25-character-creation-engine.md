# Original Character Creation Engine Implementation Plan

**Goal:** Replace the preset-only Creation Hall with a faithful, performant implementation of Dragon Age: Legends' original Human character creator, delivered as lazy network assets from the existing private Tailscale host while preserving every current champion and every learning-state invariant.

**Architecture:** A deterministic build-time compiler will extract the original head vectors and headless, gendered body animations from the recovered SWFs into content-hashed files under `assets/creator/`. The Tailscale-served runtime will fetch one small manifest, the selected gender/class rig metadata, and only the animation atlases it needs; a cached SVG head will be composed client-side and drawn between each frame's back and front layers using the original transform. The service worker becomes cache-on-demand rather than pre-warming the entire game, the existing modal becomes a responsive creator with a separate Champions tab, and old `{rig, cls}` saves remain valid.

**Tech Stack:** Vanilla HTML/CSS/JavaScript in `index.html`, static content-hashed JSON/SVG/WebP assets, Node.js build tooling, JPEXS Free Flash Decompiler 26.2.1, Sharp as a development-only rasterizer, Python mobile/deployment tooling, Tailscale Serve over private HTTPS, browser HTTP caching, a cache-on-demand service worker, and Playwright.

---

## Authoritative inventory prerequisite and approval

This plan consumes
`docs/visual-remaster/inventory/modular-skins-inventory.json` as the
authoritative source for original modular `symbol_key` identity, source
provenance, selector mappings, layer and tint behavior, equipment and weapon
relationships, and rig compatibility. A `symbol_key` is the exact
`source_path::exact_export_name` identity. A bare export name is never a valid
build input because the inventory records duplicate names in different source
SWFs.

The committed inventory bytes are the durable evidence boundary; exploratory
scripts, `reference/dalegends/NOTES.md`, flattened frames, and screenshots may
help discovery or visual review but are not proof. The browser must never
receive the complete inventory. The compiler reads it only at build/check time,
and generated creator metadata records its schema version and SHA-256 byte
digest. `--verify-output` rejects output whose recorded digest differs from the
current inventory.

### Approved executable scope

The inventory validates Human-only scope; two genders; six face selectors;
twelve hair selectors; nine exposed skin colors; nine exposed hair colors; the
exact Human face, eye, hair, rear-hair, and facial-hair component *sets*; and
the 0.5 tint mix. It does **not** validate the selector-to-component mappings,
Human-specific layer order, starter equipment selection, weapon/rig closure, or
Human rig placements. Therefore, the only approved creator work until the
evidence is enriched is the inventory-consuming compiler contract and its
claim-audit/check tooling. It may emit no full source-faithful Human creator
bundle from the present inventory.

Every legacy task and acceptance criterion below this section is archival
design context, not executable authorization. The superseding contract and
deferred-evidence table in this section govern implementation. This preserves
the useful product requirements without allowing a likely mapping to become a
production fact.

### Compiler contract

`tools/character-creator/spec.json` must identify the committed inventory as
its evidence source. `tools/build-character-creator.js --check` must:

1. resolve every requested asset by exact `symbol_key`;
2. verify its source SWF, intended slot, applicable class and gender
   restrictions, reference status, and cited evidence; and
3. fail if a creator-relevant `MISSING_SYMBOL`, `UNKNOWN`, or
   `ORPHAN_OR_UNUSED` row is consumed without an explicit, evidence-backed
   exclusion in the spec.

The builder must write the inventory schema version and SHA-256 byte digest to
the generated manifest. `--verify-output` must rehash the current inventory
and reject digest or schema mismatches. Generated metadata may contain only the
selected, source-qualified records needed by the browser; it must not copy the
full inventory into a runtime bundle.

### Deferred evidence work — not executable creator behavior

| Reconciliation IDs | Deferred until the inventory records | Required evidence output |
|---|---|---|
| R04-R06 | `hairType` to front/rear hair mapping, bald selection, and `skinType` to facial-hair mapping | Human `CompositeHead` branch table keyed by selector value and exact `symbol_key` |
| R07 | Human-only display-list/layer order | Ordered Human branch evidence, including whether any ears layer exists |
| R10-R11 | class → starter equipment → weapon family → Human rig relationship | Normalized, source-cited relation records with exact `symbol_key` endpoints |
| R13 | Human rig placements, matrices, and back/head/front ordering | Source-cited Human rig timeline placement and transform records |
| R17 | inclusion or exclusion of every creator-relevant unknown candidate | Explicit creator-reachability or exclusion evidence for each candidate |

No task may extract, compose, test, or accept those deferred relationships from
names, source filenames, historical scripts, or visual guesses. When the
inventory gains the records above, rerun the claim audit and revise this plan
before enabling source-faithful creator output.

### Claim audit and preserved requirements

The build/check tool must audit every exact symbol, source, selector, layer,
tint, equipment, weapon, rig, and creator-reachability claim against the
inventory and its cited repository evidence. A failed claim blocks approval.
The following non-asset requirements remain binding unless future evidence
demonstrates a direct conflict: Human-only public scope; the existing champion
roster; legacy-save compatibility; learning/progression invariants; lazy,
bounded delivery; mobile generation boundaries; responsive accessible controls;
and regression coverage.

---

## Discovery record

### Current application

- `index.html:4375-4471` owns the version-1 save state and shallow migration. The current identity is split between `S.hero = {rig, cls}` and `S.heroName`.
- `index.html:4890-4905` turns every embedded `DATA.eaRig` frame into a lazily loaded `Image`. `wakeRig()` is the phone-memory boundary and must remain lazy.
- `index.html:5695-5704` creates the party from `S.hero.cls` and `S.heroName`.
- `index.html:6475-6491` chooses the player voice by testing whether the selected baked rig is one of two female presets.
- `index.html:7349-7388` defines six baked hero choices, eight legend choices, and the equipment-aware `heroRigKey()` lookup.
- `index.html:7398-7427` resolves and draws one fully flattened WebP per animation frame.
- `index.html:8749-8814` implements the present Creation Hall. It selects a complete rig preset, accepts an optional 24-character name, and explicitly says the original combinations are baked offline.
- `index.html:9419-9450` exposes the test bridge.
- `tests/sprites.spec.js:107-129` locks the six complete hero rigs and the Deymour legacy fallback.
- `tests/hall.spec.js:72-125` locks portrait quality, the Half-Elf Rogue and Red Wizard, and current portrait cropping.
- Several combat and quest tests directly assign legacy values such as `{rig: "heroMag", cls: "caster"}`. Backward compatibility is therefore a tested contract, not optional cleanup.
- `tools/build-mobile.py` generates `mobile/`; nothing below `mobile/` may be hand-edited.
- `tools/sigilbound-mobile.service` serves `mobile/` from loopback, and `tailscale serve` exposes it over private tailnet HTTPS. The production host is therefore stable and networked; the old a-Shell-suspension assumption does not apply to this deployment.
- The current mobile service worker is cache-first but `REGISTER_SNIPPET` also fetches every generated asset immediately. That full warm-up is an inherited offline requirement, not a Tailscale requirement.
- `tools/deploy-mobile.sh` already stages and atomically swaps the generated mobile build. It is the correct deployment boundary for generated creator assets.

The current asset representation is the central gap: body, armor, weapon, face, hair, and tint are already flattened into each WebP. A runtime selector over the current representation would require 34,992 complete rigs for the original three classes, or 46,656 if the current Archer adaptation were also custom. Tailscale removes the need to embed or pre-cache that library, but it does not remove the browser download, decode-memory, or animation-composition costs. The modular back/head/front renderer remains necessary.

### Recovered original behavior

The complete source application is `reference/dalegends/DALFlashApp.swf`. JPEXS reports 3,162 ActionScript classes. The relevant classes are embedded in that SWF:

- `com.ea2d.dal.display.screens.herocreate.DMHeroEdit` — the full creator to reproduce.
- `com.ea2d.dal.display.screens.herocreate.DMHeroCreate` — a simpler screen that chooses among three live class avatars and eight presets from `CHARACTER_PRESET.xml`.
- `com.ea2d.dal.model.player.HeroCustomization` — `name`, `warcry`, `classID`, `raceID`, `gender`, `skinType`, `skinColor`, `hairType`, `hairColor`, and an NPC `face` override.
- `com.ea2d.dal.display.character.CompositeHead` — exact part selection, layering, tinting, and cache-key behavior.
- `com.ea2d.dal.display.character.Avatar`, `DAnimationDatabase`, and `CharClassTransformer` — convert the customization plus class starting gear into the live avatar.
- `DMHairColorPanel` and `DMSkinColorPanel` — nine selectable swatches each.
- `HeroUtil.MAX_HERO_NAME_LENGTH` — 12 characters.
- `com.ea2d.dal.util.dmf` — the shipped range and weighted-random helpers.

`DMHeroEdit` establishes these public rules:

- Race is hardcoded to Human. The Human control has an empty click handler even though `CompositeHead` contains latent Elf and Dwarf builders.
- Classes are Warrior, Mage, and Rogue. Changing class retains the appearance.
- Gender is male or female. Changing gender retains class and colors but rerolls hair and face style using the startup weights.
- Hair type cycles through 1–12 with wraparound.
- “Face” in the UI is `skinType`, cycles through 1–6, and wraps.
- Hair and skin each expose tint indices 0–8. Internal tint index 9 means “no tint” but is not a creator swatch.
- “Random Hero” preserves the current class and gender and randomizes hair type, face type, hair color, and skin color over their complete ranges.
- Initial startup randomization is biased:
  - class: Warrior 50%, Mage 25%, Rogue 25%;
  - hair color: index 0 at 60%, index 1 at 40%;
  - skin color: 1 at 25%, 2 at 25%, and 3 at 50%;
  - male face: 1–4 at 25% each;
  - female face: weights 40:30:20 for types 1, 5, and 3 (the shipped table totals 90 and the original helper normalizes by that total);
  - male hair: 5 at 40%, 2 at 30%, 7 at 15%, 11 at 15%;
  - female hair: 7 at 40%, 2 at 30%, 8 at 30%.
- The name must contain at least one non-space character and be no longer than 12 characters before “Begin Your Journey” is enabled.
- In the Hero Room edit mode, class, gender, and randomization are disabled; name and appearance remain editable.
- Every appearance change rebuilds a live, idle avatar.

The original submit path also creates server inventory, randomizes a warcry, sets a campaign location, fills health/power, and broadcasts service events. Those effects do not belong in this game. Class and appearance remain tactical/presentational and must never alter spaced-repetition progress, mastery, or certification meters.

The exact original range helper is `round(rng * (max - min)) + min`, not a `floor`-based integer draw. Its endpoint buckets are half-width. The weighted helper sums the declared weights, uses that range helper over `1..total`, and returns the first cumulative match. Reproduce these semantics in the source-faithful helper; do not silently substitute a statistically cleaner implementation.

### Recovered original assets and data

Primary data:

- `reference/dalegends/data/CHARACTER_PRESET.xml` — four male and four female presets used by the simpler creator.
- `reference/dalegends/data/CHARACTER_RACE.xml` — Human declares 6 skin/face types and 12 hair types.
- `reference/dalegends/data/CHARACTER_CHARCLASS.xml` — original Warrior, Rogue, and Mage starting gear and player-animation flags.
- `reference/dalegends/data/ANIMATION_ANIM_RIGS.xml` — maps player weapon types to the HumanElf rigs.
- `reference/dalegends/data/STRINGS_CHARCREATORSTRINGRESOURCES.xml` — creator labels, tooltips, and Human face/hair option names.
- `reference/dalegends/data/ANIMATION_ANIM_SKIN_COLORS.xml` — general skin archetypes; it is not the creator head palette.

Player bodies and equipment:

- `reference/dalegends/assets/anims_HumanElf_2H.swf`
- `reference/dalegends/assets/anims_HumanElf_DUAL.swf`
- `reference/dalegends/assets/anims_HumanElf_STAFF.swf`
- `reference/dalegends/assets/anims_HumanElf_BOW.swf` remains relevant to the retained Archer preset.
- `reference/dalegends/assets/animSkins_HumanElf_Heavy_Basic.swf`
- `reference/dalegends/assets/animSkins_HumanElf_Leather_Basic.swf`
- `reference/dalegends/assets/animSkins_HumanElf_Robe_Basic.swf`
- The matching `*_Standard.swf` files provide the current equipment-upgrade appearance.
- `reference/dalegends/assets/animSkins_Weapons_2h_Swords.swf`
- `reference/dalegends/assets/animSkins_Weapons_dual.swf`
- `reference/dalegends/assets/animSkins_Weapons_staves.swf`
- `reference/dalegends/assets/animSkins_Weapons_bow.swf`

The `anims_HumanElf_*` timelines are bare rigs. Named placements such as limbs, `head`, `helmet`, `helmetBack`, weapon, bow, and robe skirt are replaced from the skin SWFs. Existing exploratory tools document the recovered composition:

- `reference/dalegends/tools/compose2.js`
- `reference/dalegends/tools/headskin2.js`
- `reference/dalegends/tools/headskin3.js`
- `reference/dalegends/tools/hero_pipeline.js`
- `reference/dalegends/tools/batch18.js`

These scripts are valuable ground truth but are not production build tools: they depend on `/tmp/dal`, an out-of-repo `sharp`, and one-off generated inputs.

Human head symbols live in `DALFlashApp.swf`, not in an `animSkins` SWF. The creator-visible set consists of:

- male/female `headSkin` variants 1–6;
- male/female eyes;
- 12 mapped hair choices per gender, including the required rear-hair symbols and the male bald option;
- `hm_facial_1..5`, coupled to male face types 2–6.

The exact `CompositeHead` order is rear hair → skin (with beard as a child) → eyes → front hair. The exact creator palettes are:

```text
skin = [16441285, 16240275, 13668706, 15708306, 12548926,
        7424821, 16577504, 4862756, 3090212]
hair = [0, 5915442, 15585637, 3751505, 10374456,
        14640941, 13092807, 7097197, 11372869]
```

Each exposed color uses Flash `setTint(color, 0.5)`: RGB output is `source * 0.5 + tint * 0.5`, with alpha unchanged. `CompositeHead` caches by class, race, gender, skin type/color, hair type/color, and NPC face override.

Creator UI symbols are also inside `DALFlashApp.swf`:

- character ID 1810 / `DMCreateCharSWF` — the full 600×600 “Customize Your Hero” panel.
- character ID 1536 / `DMSimpleCharacterCreatorSWF` — the parchment “Choose Your Character” panel.
- character IDs 1766, 1782–1785, and 1809 — creator frame, swatch, color-option backgrounds, and random-button art.

The static creator panels are visual references, not suitable as a responsive DOM or accessible control layer. Reproduce their layout and visual language with HTML/CSS while using the original character vectors and animation.

### Historical prototype

Unmerged commits `8ff8478` and `342766e` prove that a head can be assembled from independently cached SVG layers and used by portraits and combat. They contain useful patterns such as `creatorHeadImage`, slot compatibility checks, deterministic selection tests, and a six-layer portrait.

Do not cherry-pick either commit. The work covers one manually redrawn Elf-male head, targets a different cutout-puppet renderer, and commit `342766e` also removes unrelated files. Recover only focused ideas if they remain useful.

## Scope decisions

1. The first complete engine implements the original public creator: Human, two genders, six face types, twelve hair types, nine skin colors, nine hair colors, and Warrior/Rogue/Mage.
2. The current Archer, Half-Elf Rogue, Red Wizard, and eight legends remain available under a separate Champions tab. No current choice disappears.
3. A later phase may expose Elf/Dwarf builders or make Archer a custom class, but neither is presented as original creator behavior.
4. Old version-1 saves keep their current champion. Do not bump the save version or alter the save-sync `sr` contract for an appearance-only feature.
5. Do not import the original service-call, inventory, level, warcry, or progression side effects.
6. Do not publish or move EA-derived assets outside this private repository.
7. The supported deployment target is the existing always-on, tailnet-only HTTPS host. Continuous offline play and eagerly downloading the entire art library are not acceptance requirements.
8. Keep game logic in canonical `index.html`, but make a narrow, documented exception to the single-file rule for generated, content-hashed creator assets under `assets/creator/`. Source SWFs and the deterministic compiler remain canonical; generated `mobile/` remains generator-only.
9. Retain a service worker for Home Screen/update behavior and opportunistic resilience, but cache assets only after the game requests them. Use network-first handling with a cached fallback for mutable entry points and cache-first handling for content-hashed assets. Do not restore a “warm every asset” loop or an offline-complete badge.
10. Content-hashed creator files receive long-lived immutable HTTP caching; mutable entry points (`index.html`, `sw.js`, `asset-manifest.json`, and `assets/creator/manifest.json`) must revalidate on every connected use.

### Baseline note

On 2026-07-25, before any implementation changes, this focused run produced 10 passes and 2 failures:

```bash
npx playwright test tests/sprites.spec.js tests/hall.spec.js
```

The two failures are existing portrait-contract mismatches in `tests/sprites.spec.js:61-85` and `tests/sprites.spec.js:107-129`: the tests require dedicated portrait payloads for every villain/hero, while the current renderer and passing Hall tests deliberately fall back to idle frame 0 when a rig has no portrait. Task 0 records the rendered fallback in a separate baseline commit before creator work begins. Do not conceal or casually absorb that unrelated change into a creator commit.

## Task 0: Stabilize the existing portrait fallback contract

**Files:**

- Modify: `tests/sprites.spec.js:61-85`
- Modify: `tests/sprites.spec.js:107-129`

**Step 1: Reproduce the two baseline failures**

```bash
npx playwright test tests/sprites.spec.js tests/hall.spec.js
```

Expected: 10 tests pass; only the two raw `EARIG[k].portrait` assertions fail.

**Step 2: Test the public portrait behavior**

Replace those raw storage-shape assertions with calls to `portraitSquare(k)`, which is the API the Hall actually renders. For each villain and hero under test:

1. wake the rig;
2. request its square portrait;
3. load the returned URL into an `Image`;
4. assert it is square and at least 96 pixels wide;
5. retain the existing rig, class, animation, companion, and Deymour assertions unchanged.

This records the current supported fallback from a missing dedicated portrait to idle frame 0. Do not manufacture portrait payloads or alter game code in this baseline commit.

**Step 3: Verify the baseline**

```bash
npx playwright test tests/sprites.spec.js tests/hall.spec.js
```

Expected: all 12 focused baseline tests pass.

**Step 4: Commit separately**

```bash
git add tests/sprites.spec.js
git commit -m "test: align sprite portraits with rendered fallback"
```

## Target data contracts

Custom heroes extend, rather than replace, the current `S.hero` contract:

```js
{
  kind: "custom",
  rig: "creatorWarMale",
  cls: "vanguard",
  classId: "warrior",
  appearance: {
    race: "human",
    gender: "male",
    skinType: 1,
    skinColor: 4,
    hairType: 2,
    hairColor: 0
  }
}
```

Legacy and champion saves remain valid:

```js
{ rig: "heroMag", cls: "caster" }
{ rig: "beirus", cls: "vanguard" }
```

`index.html` contains only the stable manifest URL:

```js
const CREATOR_MANIFEST_URL = "assets/creator/manifest.json";
```

The mutable manifest points at content-hashed head and rig records:

```json
{
  "version": "0123456789ab",
  "heads": "heads.a1b2c3d4e5f6.json",
  "rigs": {
    "creatorWarMale": "rigs/creatorWarMale.d4e5f6071829.json"
  }
}
```

Each rig record references per-animation WebP atlases. Frame rectangles retain split layers and the original head matrix while legacy `DATA.eaRig` records keep `{x, y, d}`:

```js
{
  backAtlas: "../atlases/creatorWarMale-idle-back.<hash>.webp",
  frontAtlas: "../atlases/creatorWarMale-idle-front.<hash>.webp",
  frames: [{
    back: [atlasX, atlasY, width, height, drawX, drawY],
    front: [atlasX, atlasY, width, height, drawX, drawY],
    head: [a, b, c, d, tx, ty]
  }]
}
```

The compiler must preserve original display-list order while minimizing network requests:

```text
original SWF/XML
      │
      ├── back-of-head display objects ──> packed WebP atlas
      ├── head branch transform ─────────> six-number matrix
      └── front-of-head display objects ─> packed WebP atlas
                         │
                         └── content-hashed files on the tailnet host

heads.<hash>.json + appearance ──> exact vector layers + tint
                                ──> one cached SVG Image

draw frame: back WebP → transformed head Image → front WebP
```

This split is necessary. Drawing a new head after one flattened headless body would incorrectly place it over arms or weapons that the original display list puts in front. Atlases are a delivery optimization, not a visual compromise: opening the creator should request the manifest, the head library, one rig record, and two idle atlases—not dozens of frame files or the other eleven body rigs.

## Task 1: Lock the recovered creator contract with failing tests

**Files:**

- Create: `tests/character-creator.spec.js`
- Modify: `index.html:9419-9450`

**Step 1: Write the pure-contract tests**

Add tests that expect these bridge functions and data before they exist:

```js
test('original Human creator exposes the shipped option counts and palettes', async ({ page }) => {
  await loadGame(page);
  const out = await page.evaluate(() => {
    const c = window.__wf.CREATOR;
    return {
      race: c.race,
      classes: c.classes.map(x => x.id),
      genders: c.genders,
      faces: c.faceCount,
      hair: c.hairCount,
      skin: c.skinColors,
      hairColors: c.hairColors,
      nameMax: c.nameMax
    };
  });
  expect(out.race).toBe('human');
  expect(out.classes).toEqual(['warrior', 'mage', 'rogue']);
  expect(out.genders).toEqual(['male', 'female']);
  expect(out.faces).toBe(6);
  expect(out.hair).toBe(12);
  expect(out.skin).toHaveLength(9);
  expect(out.hairColors).toHaveLength(9);
  expect(out.nameMax).toBe(12);
});
```

Add separate tests for:

- male and female hair-type-to-symbol mappings, including male hair 8 as bald;
- male face types 2–6 selecting `hm_facial_1..5`;
- layer order for a female rear-hair style and a male bearded style;
- wraparound at hair 1/12 and face 1/6;
- exact affine tint values for black, light, and dark source pixels;
- “Random Hero” preserving class/gender and staying within all bounds;
- seeded startup randomization following the recovered weighted tables;
- class mapping `warrior → vanguard`, `mage → caster`, and `rogue → shadow`.

Use an injectable deterministic RNG or a short fixed sequence. Do not make statistical Playwright tests.

**Step 2: Run the new spec and confirm it fails**

Run:

```bash
npx playwright test tests/character-creator.spec.js
```

Expected: failure because `window.__wf.CREATOR` and the pure helper functions do not exist.

**Step 3: Expose placeholders only if needed for focused failures**

Add the intended names to `window.__wf`, but do not implement behavior merely to make every assertion fail at one line:

```js
get CREATOR(){ return CREATOR },
normalizeHero,
creatorLayers,
creatorCycle,
randomizeCreator
```

Re-run and confirm the assertions now fail on missing behavior.

**Step 4: Commit**

```bash
git add tests/character-creator.spec.js index.html
git commit -m "test: lock original character creator contract"
```

## Task 2: Implement the pure creator model and backward-compatible state normalization

**Files:**

- Modify: `index.html:4375-4471`
- Modify: `index.html:7349-7388`
- Modify: `index.html:9419-9450`
- Test: `tests/character-creator.spec.js`
- Test: `tests/sprites.spec.js`

**Step 1: Add normalization tests for old and new heroes**

Cover:

```js
normalizeHero(null) // null, preserving Deymour fallback
normalizeHero({rig:'heroMag', cls:'caster'}) // unchanged legacy champion
normalizeHero({kind:'custom', classId:'mage', appearance:{...}}) // bounded and canonical
```

Also load a serialized v1 state containing `{rig:"heroWar", cls:"vanguard"}` and verify it still resolves to `heroWar`.

**Step 2: Run the focused tests and confirm they fail**

```bash
npx playwright test tests/character-creator.spec.js tests/sprites.spec.js
```

Expected: new normalization assertions fail; existing sprite assertions remain green.

**Step 3: Add the source-faithful constants**

Near the existing hero constants in `index.html`, add a compact immutable record:

```js
const CREATOR = Object.freeze({
  race: "human",
  genders: ["male", "female"],
  faceCount: 6,
  hairCount: 12,
  nameMax: 12,
  skinColors: [...],
  hairColors: [...],
  classes: [
    {id:"warrior", cls:"vanguard", rig:"creatorWar"},
    {id:"mage", cls:"caster", rig:"creatorMag"},
    {id:"rogue", cls:"shadow", rig:"creatorRog"}
  ],
  // exact Human symbol maps and weighted startup tables
});
```

Implement pure helpers:

- `creatorDefault()` — returns a valid source-faithful starting draft.
- `creatorCycle(value, delta, min, max)` — wraps without DOM access.
- `creatorLayers(appearance)` — returns ordered `{slot, symbol, tint}` records.
- `randomizeCreator(draft, mode, rng)`:
  - `mode === "startup"` may choose weighted class/gender/appearance;
  - `mode === "gender"` retains class/colors and rerolls face/hair;
  - `mode === "appearance"` retains class/gender and uses the original full-range draws for face/hair/colors.
- `creatorRandomNum(min, max, rng)` and `creatorWeighted(rows, rng)` — reproduce `dmf`'s rounded range draw and cumulative weight handling exactly.
- `normalizeAppearance()` — clamps invalid/missing values and forces `race:"human"`.
- `normalizeHero()` — leaves known legacy/champion objects alone and canonicalizes custom objects.

Keep the shipped female startup table as recovered. Document its total weight of 90 in a code comment rather than silently “fixing” it to 100.

**Step 4: Normalize only at state boundaries**

- Keep `newState().v === 1`.
- In `load()`, call `normalizeHero(base.hero)` after the shallow overlay.
- In UI assignment paths, normalize before assigning to `S.hero`.
- Do not rewrite a valid legacy hero merely because it lacks `kind`.
- Do not add appearance to the remote sync payload; it intentionally carries only `sr`.
- Keep `S.heroName` for compatibility. Validate new custom names at submission without truncating a previously saved long champion name.

**Step 5: Run focused tests**

```bash
npx playwright test tests/character-creator.spec.js tests/sprites.spec.js
```

Expected: all pure model, legacy, and existing sprite tests pass.

**Step 6: Commit**

```bash
git add index.html tests/character-creator.spec.js tests/sprites.spec.js
git commit -m "feat: add original creator state model"
```

## Task 3: Compile content-hashed creator assets for the Tailscale host

**Files:**

- Create: `docs/adr/0002-tailnet-creator-assets.md`
- Create: `tools/character-creator/spec.json`
- Create: `tools/character-creator/swf-meta.js`
- Create: `tools/build-character-creator.js`
- Create by generator: `assets/creator/manifest.json`
- Create by generator: `assets/creator/heads.*.json`
- Create by generator: `assets/creator/rigs/*.json`
- Create by generator: `assets/creator/atlases/*.webp`
- Create: `tests/creator-assets.spec.js`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `reference/dalegends/NOTES.md`
- Modify: `index.html`

**Step 1: Record the narrow architecture exception**

Write `docs/adr/0002-tailnet-creator-assets.md` with:

- status: Accepted;
- context: production is a private, always-on Tailscale HTTPS host;
- decision: keep application logic in `index.html`, but serve generated creator JSON/WebP assets as files;
- reason: lazy delivery, browser caching, bounded decode memory, and smaller updates;
- non-goals: modules, public hosting, server-side character rendering, or removing the existing canonical SWFs;
- cache policy: immutable hashed files, revalidated manifests/entry points;
- offline policy: cache-on-demand is allowed; complete pre-warming is not required.

**Step 2: Write a failing HTTP asset-contract test**

Create `tests/creator-assets.spec.js`:

```js
test('creator manifest exposes twelve hashed lazy body rigs', async ({ request }) => {
  const response = await request.get('/assets/creator/manifest.json');
  expect(response.status()).toBe(200);
  const manifest = await response.json();
  expect(Object.keys(manifest.rigs)).toHaveLength(12);
  expect(manifest.heads).toMatch(/^heads\.[a-f0-9]{12}\.json$/);
  for (const path of Object.values(manifest.rigs)) {
    expect(path).toMatch(/^rigs\/creator(?:War|Mag|Rog)(?:Male|Female)(?:Std)?\.[a-f0-9]{12}\.json$/);
  }
});
```

Add tests that request one rig record and assert:

- eight animation kinds;
- separate hashed back/front atlas URLs;
- a finite six-number head matrix per frame;
- no `data:` URLs;
- every referenced URL returns 200;
- no rig record references another gender/class body.

**Step 3: Run the contract test and confirm it fails**

```bash
npx playwright test tests/creator-assets.spec.js
```

Expected: 404 for `/assets/creator/manifest.json`.

**Step 4: Define the compiler specification and validation mode**

`spec.json` must declare:

- source SWF/XML paths;
- required JPEXS version;
- all Human creator symbol names and expected character IDs;
- exact hair mappings, rear-hair mappings, face/beard coupling, palettes, and layer order;
- three class body sources, armor sources, weapon sources, symbol prefixes, and current Basic/Standard naming;
- animation names and the same sparse-frame/action-frame retention used by `hero_pipeline.js`;
- maximum atlas dimension, WebP quality, and deterministic packing order.

Implement:

```bash
node tools/build-character-creator.js --check
node tools/build-character-creator.js --verify-output
```

It must:

- fail clearly if `FFDEC_JAR` is missing;
- export/read the symbol map in an OS temporary directory;
- verify every required symbol and source asset;
- rebuild into a second temporary directory;
- compare the entire generated tree with `assets/creator/`;
- report missing, stale, or unexpected generated files without modifying them.

Never use or require `/tmp/dal`.

`--verify-output` is the lightweight deployment check: it does not invoke JPEXS or Sharp, but verifies manifest shape, referenced files, filename hashes, and absence of unexpected `data:` payloads. The Tailscale host can run it without reconstructing source assets.

**Step 5: Run and confirm the intended missing-output failure**

```bash
FFDEC_JAR=/tmp/ffdec/ffdec.jar node tools/build-character-creator.js --check
```

Expected: source inventory passes, then the command reports the missing `assets/creator/` output.

**Step 6: Add Sharp as a development dependency**

```bash
npm install --save-dev sharp
```

Sharp is build-time tooling only. Do not add a runtime package, browser module loader, or server-side rendering endpoint.

**Step 7: Extract origin-preserving head vectors**

For every required Human symbol:

1. Ask JPEXS for SVG.
2. Remove the export-only translation that moves the symbol bounds to `(0,0)`.
3. Preserve the Flash symbol origin, paths, and gradients.
4. Namespace SVG IDs so gradients cannot collide when fragments are composed.
5. Store one common verified Human head coordinate space.
6. Reject `<image>`, `<foreignObject>`, scripts, and external URLs.
7. Write exact vector fragments, source names, and character IDs to one content-hashed `heads.<hash>.json`.

Do not redraw, trace, simplify, recolor, or rasterize the reusable head parts.

**Step 8: Build gendered headless class rigs**

Port reusable algorithms from `compose2.js`, `headskin2.js`, and `hero_pipeline.js`:

- compose Warrior/2H/heavy, Mage/staff/robe, and Rogue/dual/leather;
- generate male and female Basic bodies;
- generate matching Standard variants used by `heroRigKey()`;
- replace `head`, `helmet`, and `helmetBack` with empty symbols;
- retain all eight animation kinds and action-frame timing.

This produces 12 finite body rigs: 3 classes × 2 genders × Basic/Standard. Do not enumerate appearance combinations.

**Step 9: Split, validate, and pack every sampled frame**

For each sampled frame:

1. Export SVG.
2. Locate the top-level branch containing the named `head` placement.
3. Multiply its matrices and record `[a,b,c,d,tx,ty]`.
4. Rasterize objects before that branch as `back`.
5. Rasterize objects after it as `front`.
6. Alpha-crop each layer and retain the foot origin.
7. Pack back crops deterministically into one animation atlas.
8. Pack front crops deterministically into a second animation atlas.
9. Fail on a missing/ambiguous head branch or an atlas exceeding the declared maximum.

Add a compiler self-test that recombines back + one known original preset head + front and compares it with the current baked preset at a small pixel-difference tolerance for idle, attack action frame, damage, death, forward, block, and evade.

**Step 10: Write content-hashed output atomically**

Generate the complete tree in a sibling temporary directory, hash file bytes with SHA-256, put the first 12 hex characters in immutable filenames, write `manifest.json` last, then atomically replace only the resolved `assets/creator/` directory.

The final mutable manifest contains relative paths. Rig records contain relative atlas paths. Stable sorting and fixed JSON separators make repeat builds byte-identical.

Add to `index.html` only:

```js
const CREATOR_MANIFEST_URL = "assets/creator/manifest.json";
```

Build and verify:

```bash
FFDEC_JAR=/tmp/ffdec/ffdec.jar node tools/build-character-creator.js
FFDEC_JAR=/tmp/ffdec/ffdec.jar node tools/build-character-creator.js --check
node tools/build-character-creator.js --verify-output
```

Expected: first command reports part/rig/atlas/frame counts; second reports that all generated creator assets are current; third verifies the deployable tree without JPEXS.

**Step 11: Run the HTTP contract tests**

```bash
npx playwright test tests/creator-assets.spec.js
```

Expected: manifest, rig metadata, and referenced hashed assets pass.

**Step 12: Document the durable pipeline**

Update `reference/dalegends/NOTES.md` with the recovered behavior, Human-only scope, symbol mappings, name limit, back/head/front reason, atlas layout, reproducible command, and the distinction between source SWFs, generated `assets/creator/`, canonical `index.html`, and generated `mobile/`.

**Step 13: Commit**

```bash
git add docs/adr/0002-tailnet-creator-assets.md package.json package-lock.json tools/character-creator tools/build-character-creator.js assets/creator reference/dalegends/NOTES.md index.html tests/creator-assets.spec.js
git commit -m "build: compile tailnet creator assets"
```

## Task 4: Implement the lazy network loader, exact head composition, and split-frame renderer

**Files:**

- Modify: `index.html:4890-4905`
- Modify: `index.html:7398-7427`
- Modify: `index.html:8749-8770`
- Modify: `index.html:9419-9450`
- Test: `tests/character-creator.spec.js`
- Test: `tests/creator-assets.spec.js`
- Test: `tests/sprites.spec.js`

**Step 1: Add failing runtime and rendering tests**

Test that:

- two different hair types create different head cache keys and pixel hashes;
- changing only hair color leaves the layer symbols unchanged but changes rendered pixels;
- male face 1 has no beard and face 6 has `hm_facial_5`;
- a female rear-hair style draws the rear layer before the skin;
- every generated custom rig has all eight required animation kinds;
- every custom frame has a finite six-number head matrix;
- a known original preset recomposes within the compiler-approved pixel tolerance;
- flipped rendering mirrors the complete back/head/front unit, not only the body;
- an undecoded head defers the complete custom frame instead of drawing a headless hero;
- legacy `DATA.eaRig` frames still use the existing one-image path;
- title boot requests no `/assets/creator/` URLs;
- opening the creator requests exactly the mutable manifest, hashed head library, selected rig record, and selected idle back/front atlases;
- no unselected class/gender/Standard rig record is requested;
- using a non-idle pose loads only that animation's missing atlases;
- concurrent requests for the same manifest/rig/atlas share one promise;
- a failed request exposes a retryable state and does not draw a partial custom hero.

**Step 2: Run and confirm failures**

```bash
npx playwright test tests/character-creator.spec.js tests/sprites.spec.js
```

Expected: model tests pass; new asset/render tests fail because runtime composition is not present.

**Step 3: Add a single-flight creator asset loader**

Keep network creator assets separate from legacy `DATA.eaRig`/`EARIG`:

```js
const CREATOR_ASSETS = {
  manifest: null,
  heads: null,
  rigs: new Map(),
  animations: new Map(),
  pending: new Map(),
  errors: new Map()
};
```

Implement:

- `creatorFetchJson(url)` — same-origin fetch, response validation, one in-flight promise per URL, and retry after a rejected promise is removed;
- `loadCreatorManifest()` — fetches only `CREATOR_MANIFEST_URL`;
- `loadCreatorHeads()` — resolves the hashed head path relative to the manifest URL;
- `loadCreatorRig(key)` — rejects unknown keys before issuing a request;
- `wakeCreatorAnimation(key, kind)` — loads the selected rig record and only that animation's two atlases;
- `creatorAnimationReady(key, kind)` — synchronous read used by the render loop.

Resolve all child URLs with `new URL(relative, parentUrl)` rather than string concatenation so canonical and `/mobile/` builds use the same manifest.

On an HTTP, JSON-shape, image-decode, or unknown-rig error:

- store a reader-safe error state;
- remove the rejected single-flight promise so Retry can work;
- do not poison legacy `EARIG`;
- do not draw a back layer without a ready head/front layer.

**Step 4: Add a bounded composed-head cache**

Implement:

- `creatorHeadKey(appearance)`;
- `creatorHeadSvg(appearance)`;
- `creatorHeadImage(appearance)`;
- `creatorHeadReady(appearance)`;
- `clearCreatorPreviewCache()` for drafts and tests.

After `loadCreatorHeads()` succeeds, generate one SVG per appearance:

- place the normalized source fragments in exact layer order;
- apply an SVG affine color filter equivalent to Flash `setTint(color, 0.5)`;
- leave eyes untinted;
- apply hair tint to rear hair, front hair, and beard;
- apply skin tint to the selected face;
- retain a common origin/view box.

Create Blob URLs rather than enormous encoded data URLs. Use an LRU capped at 16 decoded heads; revoke each evicted Blob URL so repeated draft randomization cannot retain unbounded memory.

**Step 5: Extend rig lookup without regressing legacy rigs**

`rigAnim`, `rigDur`, and `rigActionDelay` must read either a legacy `DATA.eaRig` record or a loaded creator rig. Keep `wakeRig()` unchanged for legacy art. Custom calls use `wakeCreatorAnimation()` and atlas images stored in `CREATOR_ASSETS.animations`.

The title screen must not fetch or decode the creator manifest, creator bodies, or head library. The creator preview starts the first creator requests; later animation kinds load on first use.

**Step 6: Refactor the draw path**

Create a context-accepting core so the battle canvas, creator preview, and portrait can share it:

```js
function drawRigTo(targetCtx, key, kind, clock, options) { ... }
function drawRig(key, kind, clock, options) {
  return drawRigTo(ctx, key, kind, clock, options);
}
```

When a creator frame and `options.appearance` are ready:

1. establish flip/scale once around the whole unit;
2. draw the frame's source rectangle from the back atlas;
3. apply the recorded head matrix;
4. draw the composed head at its Flash origin;
5. restore the matrix;
6. draw the frame's source rectangle from the front atlas.

When a creator animation is pending, initiate/retain its load and return `false` so the existing fallback renderer remains usable. When split data or appearance is absent, retain the current legacy behavior exactly.

At the party draw call, pass `S.hero.appearance` only for a custom hero. Companions, legends, and old presets remain unchanged.

**Step 7: Make portraits appearance-aware**

Refactor `portraitSquare(rigKey)` into an optional appearance-aware form:

```js
portraitSquare(rigKey, appearance)
```

The cache key must include `creatorHeadKey(appearance)`, manifest version, and effective equipment rig. Render the compiled portrait animation/frame through `drawRigTo`, crop alpha as today, and retain the 96-pixel minimum expected by `hall.spec.js`.

**Step 8: Run focused tests**

```bash
npx playwright test tests/creator-assets.spec.js tests/character-creator.spec.js tests/sprites.spec.js tests/hall.spec.js
```

Expected: lazy request boundaries, retry behavior, custom composition, known-preset comparison, legacy rigs, and portraits all pass.

**Step 9: Commit**

```bash
git add index.html tests/creator-assets.spec.js tests/character-creator.spec.js tests/sprites.spec.js tests/hall.spec.js
git commit -m "feat: stream modular original heroes"
```

## Task 5: Build the responsive creation flow and preserve the champion roster

**Files:**

- Modify: `index.html:280-291`
- Modify: `index.html:8727-8814`
- Modify: `index.html:9419-9450`
- Test: `tests/character-creator.spec.js`
- Test: `tests/hall.spec.js`

**Step 1: Add failing interaction tests**

Using the actual modal DOM, test:

- new-game Creation Hall opens on “Create Hero”;
- the live preview canvas is visible and becomes drawable;
- class buttons are Warrior/Mage/Rogue;
- gender buttons are Male/Female;
- hair and face arrows wrap and update their original string-resource names;
- each palette contains exactly nine keyboard-accessible swatches;
- “Random Hero” retains class and gender;
- the submit button is disabled for empty, all-space, or over-12-character custom names;
- submitting stores a normalized custom hero and starts the existing intro callback;
- closing/canceling a draft does not mutate `S.hero`;
- opening the creator requests only the manifest, head library, selected Basic rig, and its idle back/front atlases;
- changing face, hair, or colors does not refetch the selected body;
- switching class or gender loads only the newly selected Basic rig;
- a failed manifest, rig, atlas, or head request shows an actionable Retry control and preserves the draft;
- the Champions tab still lists all six existing hero presets and all eight legends;
- selecting an existing champion still stores the legacy `{rig, cls}` form;
- in Hero Room edit mode, a custom hero cannot change class/gender or use Random, but can change name/face/hair/colors;
- switching to Champions in Hero Room retains the current full champion-switch behavior.

Add a phone-sized test for no horizontal overflow and 44-pixel minimum interactive targets.

**Step 2: Run and confirm failures**

```bash
npx playwright test tests/character-creator.spec.js tests/hall.spec.js
```

Expected: runtime tests pass; modal interaction tests fail against the preset grid.

**Step 3: Replace the single grid with two modes**

Keep `chooseHero(after, isNew)` as the public entry point, but split internals:

- `showCreatorTab(draft, mode)`
- `showChampionTab(after, isNew)`
- `bindCreatorControls(...)`
- `commitCustomHero(...)`

The creator draft must be a detached object. Mutate `S` only after a valid “Begin Your Journey”/“Save and Close”.

Use source-faithful control behavior:

- class changes preserve appearance;
- gender changes preserve class/colors and reroll face/hair;
- Random preserves class/gender;
- hair and face arrows wrap;
- new-game names are required and capped at 12;
- in-game custom edits disable class/gender/random.

Do not implement the original Facebook-profile name/gender preload. There is no equivalent trusted input in this game.

**Step 4: Add the live preview**

Add one preview `<canvas>` and a scoped animation loop:

- render the selected class/gender Basic idle rig through `drawRigTo`;
- render a static frame when `S.settings.motion` is false;
- stop the loop and release draft references when the modal closes;
- show a small loading state until the lazily loaded selected body and composed head are ready;
- show Retry after a network failure without discarding the current draft;
- associate every pending load with the draft's current rig key so a slower, stale response cannot replace a newer class/gender selection;
- do not create one canvas per option.

**Step 5: Match the original layout responsively**

Use `DMCreateCharSWF` as visual reference:

- title and Random button above the preview;
- hair controls and hair colors on the left;
- face controls and skin colors on the right;
- class and gender controls below;
- name and primary action at the bottom.

On narrow screens, turn the flanking controls into two stacked panels below the preview. Use semantic buttons, visible focus, `aria-pressed`, labels, and 44-pixel touch targets. Do not embed the static SWF screenshot as the interface.

**Step 6: Preserve current champion behavior**

Move the current six `HERO_CHOICES` and eight `LEGEND_CHOICES` cards, stats, portrait handling, sounds, toast, and save callback into the Champions tab. Retain the current optional champion naming behavior and do not truncate a legacy saved name when merely opening the room.

**Step 7: Run focused UI tests**

```bash
npx playwright test tests/character-creator.spec.js tests/hall.spec.js
```

Expected: creator behavior, responsive controls, and the complete existing champion roster pass.

**Step 8: Commit**

```bash
git add index.html tests/character-creator.spec.js tests/hall.spec.js
git commit -m "feat: open the original character creator"
```

## Task 6: Integrate custom identity with world, combat, equipment, and audio

**Files:**

- Modify: `index.html:5695-5704`
- Modify: `index.html:6475-6491`
- Modify: `index.html:7349-7427`
- Modify: `index.html:9380-9395`
- Test: `tests/character-creator.spec.js`
- Test: `tests/originals.spec.js`
- Test: `tests/production-combat-hotbar.spec.js`

**Step 1: Add failing end-to-end identity tests**

Create a custom female Mage and verify:

- party class is `caster`;
- party name is the submitted 12-character-or-shorter name;
- `memberSpriteKey()` resolves `creatorMagFemale`;
- combat renders a non-empty custom frame;
- the female bark table is selected from `appearance.gender`;
- equipping qualifying armor resolves and fetches `creatorMagFemaleStd` only when first needed;
- unequipping returns to `creatorMagFemale`;
- a failed Standard-rig request uses the existing fallback renderer without changing the saved hero or equipment;
- no other class/gender Standard rig is requested;
- mastery, meters, `sr`, and question selection are unchanged by appearance edits.

Repeat a smaller matrix for male Warrior and male/female Rogue. Keep existing tests that directly assign `heroMag`/`heroWar`.

**Step 2: Run and confirm failures**

```bash
npx playwright test tests/character-creator.spec.js tests/originals.spec.js tests/production-combat-hotbar.spec.js
```

Expected: current presets pass; custom rig, gender bark, and equipment assertions fail.

**Step 3: Centralize effective custom rig selection**

Implement:

```js
function customHeroRig(hero) {
  // class base + normalized gender + optional "Std"
}
```

Update `heroRigKey()` to:

1. return the stable manifest rig key for the custom class/gender when `hero.kind === "custom"`;
2. apply the current Standard armor rule to that base;
3. retain current preset and Deymour fallback behavior.

The returned key is identity, not proof that its atlases are already resident. Custom draw calls start or join the matching lazy rig/animation request; legacy calls continue using `rigReady()` and `wakeRig()`. Do not change item stat calculations or combat math.

**Step 4: Make identity consumers use the normalized model**

- `buildParty()` continues to derive mechanics from `hero.cls`.
- `heroBark()` uses `hero.appearance.gender` for custom heroes, current baked-rig mapping for legacy presets, and existing monster voices for legends.
- world rendering and battle rendering pass appearance only for the custom hero.
- any hero portrait/HUD surface uses the appearance-aware portrait cache.
- creator edits invalidate only custom portrait/head cache entries, not all rig art.

**Step 5: Prove the learning invariants**

Before and after changing every appearance field, compare serialized:

- `S.sr`;
- `meterOf("c")` and `meterOf("g")`;
- badges;
- region progress;
- current quest.

Only hero identity and presentation may change.

**Step 6: Run integration tests**

```bash
npx playwright test tests/character-creator.spec.js tests/originals.spec.js tests/production-combat-hotbar.spec.js tests/smoke.spec.js
```

Expected: all custom identity, legacy identity, equipment, combat, and immutable learning tests pass.

**Step 7: Commit**

```bash
git add index.html tests/character-creator.spec.js tests/originals.spec.js tests/production-combat-hotbar.spec.js
git commit -m "feat: carry custom heroes through the game"
```

## Task 7: Ship cache-on-demand creator bundles through the Tailscale host

**Files:**

- Modify: `tools/build-mobile.py`
- Modify: `tools/deploy-mobile.sh`
- Create: `tools/tailnet-static-server.py`
- Modify: `tools/sigilbound-mobile.service`
- Modify: `docs/phone-runbook.md`
- Modify: `docs/phone-runbook-plain.md`
- Modify: `docs/phone-acceptance.md`
- Modify: `mobile/README.md`
- Modify by generator: `mobile/index.html`
- Modify by generator: `mobile/assets/creator/*`
- Modify by generator: `mobile/asset-manifest.json`
- Modify by generator: `mobile/sw.js`
- Test: `tests/mobile-boot.spec.js`
- Test: `tests/mobile-battle.spec.js`
- Delete: `tests/mobile-offline.spec.js`
- Create: `tests/mobile-cache.spec.js`
- Create: `tests/tailnet-host.spec.js`
- Modify: `tests/mobile-update.spec.js`
- Test: `tests/character-creator.spec.js`

**Step 1: Add failing Tailscale delivery tests**

In `tests/tailnet-host.spec.js`, launch `tools/tailnet-static-server.py` on a free loopback port and assert:

- `/index.html`, `/sw.js`, `/asset-manifest.json`, and `/assets/creator/manifest.json` use `Cache-Control: no-cache`;
- content-hashed creator JSON, SVG, and WebP files use `Cache-Control: public, max-age=31536000, immutable`;
- creator JSON, SVG, and WebP files have the correct MIME types;
- a traversal attempt cannot escape the `mobile/` root.

In `tests/mobile-update.spec.js` and `tests/mobile-cache.spec.js`, assert:

- the page registers and updates its service worker without iterating over every entry in `asset-manifest.json`;
- there is no `warm()` function, `wf-warmed` marker, or “Caching art for offline” pill;
- mutable entry points use network-first fetches and a cached fallback, so a connected launch observes a new creator manifest;
- content-hashed creator assets use cache-first fetches and are added only after the runtime requests them;
- opening the creator caches only requested creator URLs;
- an unselected class/gender atlas is absent from Cache Storage;
- a requested atlas can be served from Cache Storage after a transient network failure;
- activating a new build cache deletes the prior build cache.

**Step 2: Run the delivery tests and confirm failure**

```bash
npx playwright test tests/tailnet-host.spec.js tests/mobile-update.spec.js tests/mobile-cache.spec.js
```

Expected: the current generic Python server lacks the required cache headers, and the current generated page still pre-warms every asset.

**Step 3: Make the mobile generator copy creator bundles without warming them**

Update `tools/build-mobile.py` so it:

1. copies `assets/creator/` verbatim to `mobile/assets/creator/`;
2. includes those files in the build version and `asset-manifest.json` for audit/update purposes;
3. never emits page code that loops over the manifest or fetches every asset;
4. registers the service worker and checks for updates, but removes `warm()`, `wf-warmed`, and the full-cache status pill;
5. emits a cache-on-demand service worker that:
   - uses network-first with a cached fallback for `index.html`, navigation requests, `asset-manifest.json`, `manifest.webmanifest`, and `assets/creator/manifest.json`;
   - uses cache-first for content-hashed creator assets matching `\.[a-f0-9]{12}\.`;
   - retains the existing bounded same-origin behavior for other generated game assets;
   - stores only successful GET responses;
   - purges caches from older build versions on activation.

`asset-manifest.json` remains an inventory, not a preload instruction. Do not hand-edit generated files.

**Step 4: Add explicit static cache headers**

Implement `tools/tailnet-static-server.py` as a small standard-library static server rooted at the supplied directory:

- paths whose filenames match `\.[a-f0-9]{12}\.` receive `Cache-Control: public, max-age=31536000, immutable`;
- mutable HTML, service-worker, web-manifest, asset-manifest, and creator-manifest paths receive `no-cache`;
- all other static files receive a bounded revalidation policy;
- `--bind`, `--port`, and `--directory` are explicit arguments.

Update `tools/sigilbound-mobile.service` to invoke this server on `127.0.0.1:8753`. Keep Tailscale Serve as the only external listener.

**Step 5: Put creator verification in the deployment boundary**

Before building the staging mobile tree, make `tools/deploy-mobile.sh` run:

```bash
node tools/build-character-creator.js --verify-output
```

This deployment command must validate hashes, references, and required rig/animation coverage without needing JPEXS or Sharp installed on the host. A failed verification stops before the atomic `mobile/` swap.

**Step 6: Update the Tailscale runbooks**

Document the supported path as:

```text
browser / installed Home Screen app
  -> private Tailscale HTTPS
  -> tailscale serve
  -> 127.0.0.1:8753
  -> generated mobile/
```

Remove a-Shell suspension recovery, offline-complete claims, the full-cache badge, and instructions that wait for every asset to download. Retain service restart, Tailscale Serve, HTTPS, update, rollback, and smoke-test instructions. State explicitly that the server must be reachable for uncached screens/assets, while previously requested same-build assets may survive a transient disconnect.

**Step 7: Add the mobile creator lifecycle test**

On the iPhone 13 Pro Max profile:

- open the generated mobile build;
- start a new game and open the creator;
- wait for the manifest, head library, selected Basic rig, and idle back/front atlases;
- change hair/face/colors repeatedly;
- assert the composed-head cache stays under its cap;
- assert appearance-only edits generate no body-atlas requests;
- submit and enter a battle;
- assert only the selected combat animation atlases load and draw;
- assert an unrelated class/gender body is neither requested nor cached.

**Step 8: Regenerate mobile and run focused tests**

```bash
node tools/build-character-creator.js --verify-output
python3 tools/build-mobile.py
npx playwright test tests/tailnet-host.spec.js tests/mobile-update.spec.js tests/mobile-cache.spec.js tests/mobile-boot.spec.js tests/mobile-battle.spec.js tests/character-creator.spec.js
```

Expected:

- title boot stays at or below 400 requested mobile images;
- title boot makes no creator-asset request;
- creator bodies and animations remain demand-loaded;
- battle wakes only its cast;
- only requested files enter Cache Storage;
- cache headers distinguish mutable entry points from immutable hashed creator assets.

**Step 9: Commit**

```bash
git add tools/build-mobile.py tools/deploy-mobile.sh tools/tailnet-static-server.py tools/sigilbound-mobile.service docs/phone-runbook.md docs/phone-runbook-plain.md docs/phone-acceptance.md mobile tests
git commit -m "build: stream creator assets over tailscale"
```

## Task 8: Full regression, visual QA, and documentation handoff

**Files:**

- Modify: `README.md`
- Modify: `CONTEXT.md`
- Modify: `CLAUDE.md`
- Modify: `reference/dalegends/NOTES.md`

**Step 1: Run deterministic build checks**

```bash
FFDEC_JAR=/tmp/ffdec/ffdec.jar node tools/build-character-creator.js --check
node tools/build-character-creator.js --verify-output
python3 tools/build-mobile.py
git diff --exit-code -- mobile
git diff --check
```

Expected: creator assets are current, a second mobile build is byte-stable, and no whitespace errors are present.

**Step 2: Run the full automated suite**

```bash
npx playwright test
```

Expected: all existing and new tests pass.

**Step 3: Perform a headed visual pass**

```bash
npm run serve
npx playwright test tests/character-creator.spec.js --headed
```

Manually verify:

- the title screen makes no request under `assets/creator/`;
- opening the creator loads only the manifest, head library, selected rig, and idle back/front atlases;
- face, hair, and color changes make no body-atlas requests;
- changing class/gender loads only that selected Basic body, and a failed request can be retried without losing the draft;
- entering battle loads only the selected animation kind, while reopening an already visited animation reuses the browser/service-worker cache;
- all 12 hair choices for both genders align with all six faces;
- rear hair stays behind the face;
- male beards follow face types 2–6 and hair tint;
- all nine skin/hair colors match the original swatches;
- no head detaches, crosses the body, or jumps z-order in idle, strike, special, damage, death, forward, evade, or block;
- flip mirrors the complete character;
- Basic/Standard armor switching retains the same face;
- creator layout is usable at desktop and 428×926;
- reduced-motion mode has a stable preview;
- champions and legends remain selectable;
- old local saves open unchanged.

**Step 4: Update reader-facing docs**

Document:

- where the Creator tab and Champions tab live;
- Human-only original scope and intentionally deferred Elf/Dwarf/Archer customization;
- reproducible creator and mobile build/verification commands;
- the narrow `assets/creator/` exception to the canonical single-file rule;
- the mutable-manifest/immutable-hash cache contract;
- Tailscale as the supported delivery path, with cache-on-demand resilience rather than continuous offline guarantees;
- the fact that appearance is tactical/presentational and never grants mastery.

Update `CLAUDE.md` so future changes preserve the same source-of-truth rule: gameplay code stays in `index.html`, generated creator bundles live in `assets/creator/`, and `mobile/` is generated only.

**Step 5: Final review**

```bash
git status --short
git log --oneline -8
```

Expected: only intentional changes are present and the task commits form a reviewable sequence.

**Step 6: Commit documentation**

```bash
git add README.md CONTEXT.md CLAUDE.md reference/dalegends/NOTES.md
git commit -m "docs: explain the original character creator"
```

## Acceptance criteria

- The Creator tab exposes exactly the original Human options: 3 classes, 2 genders, 6 faces, 12 hair types, 9 skin colors, and 9 hair colors.
- Face/hair mappings, beard coupling, layer order, tint math, cycling, startup weighting, Random behavior, edit-mode restrictions, and 12-character name limit match recovered original logic.
- Character art comes from the original SWFs and is extracted reproducibly; no combinatorial full-rig generation or manual redraw is used.
- Every custom hero renders correctly in preview, portrait, world, all combat animations, both facings, and Basic/Standard equipment.
- The existing six hero presets, eight legends, Deymour fallback, and old `{rig, cls}` saves still work.
- Appearance changes cannot alter `sr`, mastery, meters, badges, regions, quests, or combat math beyond the already selected class.
- Canonical gameplay code lives in `index.html`; reproducibly generated, content-hashed creator assets live in `assets/creator/`; `mobile/` is generator-only.
- The Tailscale-hosted title screen requests no creator assets. Opening the creator requests only the manifest, head library, selected Basic rig, and idle atlases; other rigs and animation kinds load only when selected or used.
- Mutable manifests and entry points revalidate; content-hashed creator files are served immutable for one year.
- The service worker caches requested same-origin assets and purges old build caches, but it never pre-warms the complete game and continuous offline play is not required.
- Mobile title boot stays at or below the existing 400-image budget, creator composition caches stay bounded, failed loads are retryable, and unrelated class/gender assets are neither requested nor cached.
- `node tools/build-character-creator.js --check`, `node tools/build-character-creator.js --verify-output`, the mobile deterministic build check, and the full Playwright suite pass.
