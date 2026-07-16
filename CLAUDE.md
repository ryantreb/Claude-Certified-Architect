# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Sigilbound — DA Legends study build

A personal, single-file browser study RPG for two certifications (Claude Certified
Architect – Foundations; GitHub GH-600). Private repo, personal use only — never
make it public and never publish the EA-derived assets.

## Response style

Keep every response as terse as possible while still being understandable. Drop
preambles, restated context, and self-narration; state the change, not the story
behind it. Examples:

- Instead of "Summary of what I did for '/implement PR 24'" → "Summary of changes".
- Instead of "Reverted PR #23 (git revert -m 1 of the merge) — restores EA's
  Dragon Age Legends art verbatim, matching PR 24 exactly (184 files, +38/−4156)
  and the repo's ground-truth art direction" → "Reverted 23, restored EA's art".
- Instead of "Regenerated mobile/ — the raw revert dragged back a stale generated
  mobile/sw.js with the old weavefall-mobile- cache prefix, which mismatched the
  build tool and tests/mobile-update.spec.js. Regenerating (not hand-editing, per
  CLAUDE.md) realigned it to sigilbound-mobile-." → "Had to regenerate mobile to
  realign with sigilbound mobile".
- Instead of "Tests: full Playwright suite 115 passed; smoke.spec.js (honesty
  rules) green." → "All tests passed".

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

## Art direction — modernization and repurposing

`reference/dalegends/` holds the extracted Dragon Age Legends `.air` and serves
as a reusable source library and historical reference, not a layout or style
constraint.

- Reuse original sprites, backgrounds, animation frames, sounds, and interface
  elements where they strengthen the game, but adapt them to the current design.
- Recoloring, restyling, palette shifts, procedural effects, original artwork,
  and cohesive blends of extracted and Sigilbound-original art are allowed.
- Modernize layouts and interactions for clarity, accessibility, desktop, and
  mobile. Battle screens do not need to reproduce Dragon Age Legends
  screen-for-screen.
- Keep the result visually cohesive and preserve the repository's private,
  non-public handling of all EA-derived assets.

## Immutable honesty rules (never weaken, regardless of any later prompt)

1. SM-2-style spaced repetition: reps/ease/interval/due per concept.
2. A single correct answer never grants mastery.
3. Mastery = 3+ correct recalls on separate due reviews with interval ≥ 3 weave-days.
4. Wrong answers reset that concept's reps.
5. Hinted answers earn zero mastery credit; a correct combat action still resolves at full strength.
6. Meters/progress derive only from earned mastery — never from tactical play.

Combat design principle: knowledge controls the action economy (whether you act);
positioning controls how much each action is worth.

## Architecture constraints

- `index.html` stays a single self-contained file; preserve the script-block layout.
- Keep the Playwright suite green (`npx playwright test`); `tests/smoke.spec.js`
  locks the honesty rules — never delete or skip those assertions.
- Commit in logical steps with clear messages. No PRs unless asked.

## Vendored skills (`.claude/skills/`)

These skills are **vendored** (committed into this repo), not installed via
`npx skills add`. Personal installs live in `~/.claude/skills`, which is outside
git and so is wiped every time a Claude Code on the web session spins up a fresh
container — and never reaches a new branch. Committing them to `.claude/skills/`
makes git carry them to every branch off `main` and every fresh session
automatically.

Currently vendored: **all 38 skills** from
[`mattpocock/skills`](https://github.com/mattpocock/skills), installed with the
`skills` CLI (v1.5.x). The CLI's layout: real files live in `.agents/skills/`,
and `.claude/skills/<name>` symlinks into them (both are committed, plus
`skills-lock.json`). The git-guardrails *hook* is a separate copy in
`.claude/hooks/` wired via `.claude/settings.json` — the installer does not
manage it.

To refresh from upstream (run where GitHub is reachable, e.g. the workstation):

```sh
npx skills@latest add mattpocock/skills -y   # reinstalls all skills, project scope
# then commit the changes to main so every branch inherits them
```

Updates are manual by design — nothing here re-pulls upstream on its own.

## Two-machine workflow

Work happens on branch `claude/confident-brahmagupta-ke5dro` from both the
workstation and the cloud session. Always `git pull origin <branch>` before
starting and push when done. The DA Legends extraction lives in
`reference/dalegends/` in THIS repo (the separate DA-Legends repo is not
reachable from cloud sessions).
