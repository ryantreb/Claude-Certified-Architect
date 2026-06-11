# Weavefall — DA Legends study build

A personal, single-file browser study RPG for two certifications (Claude Certified
Architect – Foundations; GitHub GH-600). Private repo, personal use only — never
make it public and never publish the EA-derived assets.

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
