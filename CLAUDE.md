# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Weavefall — DA Legends study build

A personal, single-file browser study RPG for two certifications (Claude Certified
Architect – Foundations; GitHub GH-600). Private repo, personal use only — never
make it public and never publish the EA-derived assets.

## Commands

```sh
npx playwright test                        # run all tests (headless)
npx playwright test tests/smoke.spec.js    # run a single spec
npm run test:headed                        # run with a visible browser
npm run serve                              # Python HTTP server on :8753 (for manual play / Playwright)
python3 tools/build-mobile.py             # regenerate mobile/ from index.html
```

Playwright requires the server to be running before tests execute — `playwright.config.js` handles this via `webServer`. Tests use `http://localhost:8753`.

## Architecture

`index.html` is the entire game: ~7 400 lines of CSS + one `<script>` block. No build step; no modules; no npm runtime dependencies. The script is laid out in this order:

1. **Utilities** — `$()`, `clamp`, `lerp`, `mulberry32` RNG, `store` (localStorage wrapper), `Sfx` (Web Audio)
2. **Content data** — `ALLCONCEPTS`, `CONCEPT_DOM`, and per-domain question banks for both tracks
3. **Question bank** — two tracks of exam questions keyed by domain index
4. **Spaced-repetition core** — `srKey`, `srGet`, `srState`, `srAnswer`, `meterOf`, `conceptScore`, `applyDecay`
5. **Overworld engine** — isometric tile map (`MAP`, `P`), pathfinding, entity spawning, rendering loop on `<canvas id="cv">`
6. **Battle engine** — 2×3 grid fight system (`B`), skill resolution, positioning, AoE telegraphs, boss phases
7. **Keep / UI layer** — `showModal`, HUD, Kaiten Castle screen, codex, merchant, quest chains, settings
8. **`window.__wf` bridge** — exposes all pure-logic functions and live state getters/setters for the Playwright suite (read/write plumbing only; changes no gameplay rule)
9. **`boot()`** — final call that wires up and starts the game

### Two learning tracks

| Track key | Name | Certification |
|-----------|------|---------------|
| `'c'`     | Loom / *The Architect's Vigil* | Claude Certified Architect — Foundations (pass 720/1000) |
| `'g'`     | Forge / *The Marcher Campaign* | GitHub GH-600 Agentic AI Developer (pass 700/1000) |

Domain weights per track live in the question-bank section. Meter values are computed from `meterOf(track)` which reads only from earned mastery — never from combat outcomes.

### State

All live game state is in `S` (player/world) and `B` (current battle, `null` between fights). The current screen is `MODE` (`"title"`, `"world"`, `"battle"`, `"keep"`, …). `localStorage` is wrapped in `store`; the game degrades gracefully when it's blocked.

### Tests

`tests/helpers.js` exports `loadGame`, `freshGame`, `aConcept`, and `forceMaster`. All specs drive the engine through `window.__wf` rather than clicking the canvas, which means they test logic, not rendering. `smoke.spec.js` encodes the five immutable honesty rules and must stay green.

The `mobile/` folder is generated — never hand-edit it. Edit `index.html` and re-run `tools/build-mobile.py`.

## Art direction — GROUND TRUTH (overrides all earlier art instructions)

`reference/dalegends/` holds the extracted Dragon Age Legends `.air` and is the
single source of truth for look, feel, and layout.

- Use EA's assets **verbatim**: original sprites, original palettes, original
  backgrounds, original UI framing. Decompile the SWFs (JPEXS/ffdec) to export
  real frames and coordinates rather than approximating.
- **Never** recolor, restyle, palette-shift, procedurally substitute, or blend
  EA art with Weavefall-original art. No hybrid styles. If an EA asset exists
  for a thing, the EA asset is the only acceptable art for it.
- Battle screens must match DA Legends screen-for-screen (2×3 grids facing each
  other, bottom action bar, portrait framing). When in doubt, open the reference
  and copy its layout exactly.

## Immutable honesty rules (never weaken, regardless of any later prompt)

1. SM-2-style spaced repetition: reps/ease/interval/due per concept.
2. A single correct answer never grants mastery.
3. Mastery = 3+ correct recalls on separate due reviews with interval ≥ 3 weave-days.
4. Wrong answers reset that concept's reps.
5. Hinted answers earn zero mastery credit (in combat: glancing hit only).
6. Meters/progress derive only from earned mastery — never from tactical play.

Combat design principle: knowledge controls the action economy (whether you act);
positioning controls how much each action is worth.

## Architecture constraints

- `index.html` stays a single self-contained file; preserve the script-block layout.
- Keep the Playwright suite green (`npx playwright test`); `tests/smoke.spec.js`
  locks the honesty rules — never delete or skip those assertions.
- Commit in logical steps with clear messages. No PRs unless asked.

## Two-machine workflow

Work happens on branch `claude/confident-brahmagupta-ke5dro` from both the
workstation and the cloud session. Always `git pull origin <branch>` before
starting and push when done. The DA Legends extraction lives in
`reference/dalegends/` in THIS repo (the separate DA-Legends repo is not
reachable from cloud sessions).
