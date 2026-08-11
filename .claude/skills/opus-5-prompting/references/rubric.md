# The Opus 5 Prompt Rubric (v1)

A 15-criterion rubric for judging whether a prompt is *Opus-5-ready*. Every
criterion traces to Anthropic's Claude Opus 5 documentation:

- **[G]** [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5)
- **[E]** [Effort](https://platform.claude.com/docs/en/build-with-claude/effort)
- **[M]** [Migration guide — Opus 4.8 → Opus 5](https://platform.claude.com/docs/en/about-claude/models/migration-guide)
- **[B]** [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

Nothing in this rubric is invented. If a claim has no bracket tag, it is a
scoring convention of the rubric itself, not a model fact.

---

## How to score

Each criterion gets **PASS / PARTIAL / FAIL / N/A**.

| Score | Meaning |
|---|---|
| PASS | The prompt (or its stated runtime config) satisfies the criterion outright. |
| PARTIAL | Addressed but vague, incomplete, or in the wrong layer (e.g. stated in prose when it belongs in a parameter). |
| FAIL | Absent, or actively counterproductive on Opus 5. |
| N/A | The criterion does not apply to this prompt type — must be justified in one clause. |

**Readiness score** = `2×PASS + 1×PARTIAL` over `2 × (applicable criteria)`, as a percentage.

| Band | Verdict |
|---|---|
| 90–100% | Opus-5-ready |
| 75–89% | Minor tuning |
| 50–74% | Needs work |
| < 50% | Rewrite |

### Blockers override the band

A prompt cannot be graded **Opus-5-ready**, whatever its percentage, while any
blocker is open. Blockers are configuration or instruction states that Opus 5
handles differently from prior models and that reliably degrade output:

| # | Blocker | Criterion |
|---|---|---|
| BL-1 | `thinking: {type: "disabled"}` combined with effort `xhigh` or `max` — **returns HTTP 400** [M] | A2 |
| BL-2 | **Self**-verification scaffolding — "double-check your answer", "add a final verification step", "use a subagent to verify" [G]. Instructions to run *external* checks (the test suite, a linter, an API call) are tool use, not self-verification, and never trigger this blocker. | C2 |
| BL-3 | A qualitative filter bar ("only high-severity", "be conservative") on a find-everything task [G] | D2 |
| BL-4 | A rule telling the model not to think or not to reason (increases XML tag leakage) [G] | A3 |
| BL-5 | Effort/`max_tokens` values carried over from an earlier model with no re-sweep [G][E][M] | A2, D5 |

---

## Applicability matrix

Which criteria to expect by prompt type. `•` = normally applies, `~` = applies
if the prompt touches that surface, blank = usually N/A.

| | A1 | A2 | A3 | B1 | B2 | B3 | B4 | C1 | C2 | C3 | D1 | D2 | D3 | D4 | D5 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **System prompt (user-facing product)** | • | • | • | • | ~ | ~ | • | • | • | ~ | • | ~ | • | ~ | • |
| **Agent / Claude Code task prompt** | • | • | • | ~ | • | ~ | ~ | • | • | • | • | ~ | • | • | • |
| **Agent harness / system scaffolding** | • | • | • | • | • | • | • | • | • | • | • | • | • | • | • |
| **Skill or reusable template** | • | ~ | ~ | ~ | ~ | ~ | ~ | • | • | ~ | • | ~ | • | ~ | ~ |
| **One-shot chat query** | • | ~ | | ~ | | ~ | | • | ~ | | • | ~ | ~ | | |

The matrix is a starting expectation, not the score. Whatever you end up marking,
**every one of the 15 criteria must appear in the output table** with a score or
an N/A plus its one-clause justification — that is what makes the percentage
reproducible by a second grader.

---

# Group A — Runtime configuration (parameter layer, not prose)

## A1 — Parameter–prompt separation

**Opus 5 behavior.** Effort controls how much the model *thinks*, not how much
it *says*: "lowering effort can reduce thinking volume without reliably
shortening the visible response" [G][E]. Depth, tool-call volume, and
truncation are parameter-layer concerns (`effort`, `thinking`, `max_tokens`)
[E].

**PASS** — Every issue is addressed in the layer that controls it. Depth and
cost live in `effort`; truncation in `max_tokens`; visible length in prompt text
(see B1). Runtime recommendations are stated *outside* the prompt body.

**PARTIAL** — Mostly separated, but the prompt still contains one or two soft
depth-nudges ("be thorough") that duplicate an effort setting.

**FAIL** — The prompt tries to buy a parameter with prose: "think very
carefully", "use maximum effort", "be exhaustive", "consider every angle"; or it
tries to shorten output by lowering effort instead of prompting for length.

**Detection.** grep for: `think (harder|carefully|deeply)`, `maximum effort`,
`be (exhaustive|thorough)`, `leave no stone`, `budget_tokens`, `temperature`.

**Fix.** Strip the reasoning-theater from the prompt body and emit a
*Recommended runtime settings* note beside it.

---

## A2 — Effort, thinking, and `max_tokens` are valid and deliberate

**Opus 5 behavior.**
- Thinking is **on by default**; Opus 4.8 ran the same request without thinking [M].
- Thinking can be disabled **only at effort `high` or below**; `disabled` + `xhigh`/`max` **returns 400**, validated per request [M][E].
- Supported effort levels: `low`, `medium`, `high` (default), `xhigh`, `max` [E].
- Recommended start: **`high` (the default)**; step up to `xhigh` for demanding coding/agentic work, `max` where unconstrained spend is justified; use `low`/`medium` liberally as the primary cost/latency control wherever evals hold [G][E].
- Carried-over effort settings need a **fresh effort sweep** [G][E][M].
- At `xhigh`/`max`, set a large `max_tokens` — **start at 64k** [E][M].
- `max_tokens` is a hard limit on **thinking + response text** together [M].
- Effort is request-level and **shapes the rendered prompt**: changing it between requests breaks cached prefixes, so hold it constant inside a cached conversation [E].
- Prompt caching minimum drops to **512 tokens** on Opus 5 (was 1,024) [M].

**PASS** — Effort level is stated and justified by task class; thinking on/off is
a deliberate decision; no 400-producing combination; `max_tokens` has headroom
(≥ 64k when `xhigh`/`max`); effort is held constant across a cached session.

**PARTIAL** — Some settings stated, others left implicit; or effort chosen by
analogy to a prior model without a re-sweep noted.

**FAIL** — 400-producing combination (**BL-1**); `budget_tokens` present;
settings silently inherited from Opus 4.8/4.7 (**BL-5**); thinking assumed off
when the prompt never disables it.

**Detection.** grep for: `budget_tokens`, `temperature`, `top_p`, `top_k`,
`effort`, `thinking`, `max_tokens`. Cross-check every effort/thinking pair
against BL-1, and every `max_tokens` against the 64k floor at `xhigh`/`max`.

**Fix.** Emit a runtime note:

```
Effort: high (default) — step to xhigh for the hardest coding/agentic runs.
Thinking: on (default). If you must disable it, effort must be high or below.
max_tokens: ≥ 64k at xhigh/max; remember it caps thinking + text together.
Eval: run a fresh effort sweep; do not reuse an Opus 4.8 setting.
```

---

## A3 — Thinking-disabled artifacts are mitigated

**Opus 5 behavior.** With thinking disabled, two artifacts can appear [G]:
1. **Tool calls emitted as plain text** instead of a structured `tool_use` block. The turn completes, the call never runs, and in agentic loops the leaked text persists in history and affects later turns. Most common on tool-heavy workloads such as search.
2. **Internal XML tags** (`<thinking>` and others) leaking into visible output.

A system-prompt rule telling the model **not to think or not to reason increases
tag leakage** [G]. Instructions that **name** thinking tags specifically are
*less* effective than the general form [G]. The primary mitigation is to keep
thinking enabled and control cost with lower effort: "for most tasks, thinking
enabled at `low` effort performs better than thinking disabled at similar cost"
[G].

**N/A** only when the prompt has no say over runtime configuration — a chat-surface
query where the author cannot set `thinking`. If the prompt or its harness controls
the setting, A3 is applicable and scores below; thinking-on is a PASS, not an N/A.

**PASS** — Thinking stays enabled (the default) with cost controlled by effort;
**or**, where disabling is mandatory, the prompt carries the combined mitigation
in spirit, contains no "do not think" rule, and does not name thinking tags.

**PARTIAL** — Thinking disabled with only one of the two artifacts mitigated, or
the mitigation names `<thinking>` explicitly.

**FAIL** — Thinking disabled with no mitigation, or a "do not think / do not
reason" rule present (**BL-4**).

**Detection.** grep for: `do not (think|reason)`, `don't think`, `without
thinking`, `<thinking>`, `"disabled"`, `no reasoning`.

**Fix (paste-ready, from the guide).**

```
When you use a tool, you may say a brief sentence first. If no tool can express what the user asked for, say so instead of guessing. Do not include internal or system XML tags in your response.
```

---

# Group B — Output volume (Opus 5's dominant failure mode)

## B1 — Conversational length is calibrated explicitly

**Opus 5 behavior.** "Claude Opus 5's default user-facing responses run longer
than prior Opus models'" and effort does not reliably shorten them — "To control
response length, prompt for it explicitly" [G][E][M]. In a long system prompt,
pair the main instruction with a **short reminder near the end** [G].

**PASS** — An explicit conciseness or target-length instruction exists; in long
system prompts, a short end-of-prompt reminder repeats it.

**PARTIAL** — A one-word gesture ("be concise") with no shape, or a length rule
buried mid-prompt in a long system prompt with no reminder.

**FAIL** — No length guidance in a prompt whose output the user reads directly;
or length is (wrongly) delegated to a lowered effort setting.

**Detection.** grep for: `concise`, `brief`, `short`, `length`, `words`,
`paragraphs`. Zero hits in a user-facing prompt is a FAIL on its own.

**Fix (from the guide).**

```
Keep responses focused, brief, and concise. Keep disclaimers and caveats short, and spend most of the response on the main answer. When asked to explain something, give a high-level summary unless an in-depth explanation is specifically requested.
```

Plus, near the end of a long system prompt:

```
<tone_preference>
Keep outputs reasonably concise.
</tone_preference>
```

---

## B2 — Progress-update cadence is specified

**Opus 5 behavior.** Opus 5 "narrates readily during agentic work: it tends to
announce what it is about to do, and its per-message output in agentic sessions
is often longer than prior models'." It "benefits from explicit guidance on how
to communicate with the user during a task" [G].

**PASS** — The prompt describes cadence *and* shape: when to speak before
acting, what triggers a mid-task update, and how to open the final message.

**PARTIAL** — Narration mentioned but only as volume ("don't over-narrate") with
no cadence or shape.

**FAIL** — Agentic prompt with no narration guidance; or legacy fixed-interval
scaffolding ("summarize every 3 tool calls") that fights the model's own cadence.

**Detection.** grep for: `update`, `narrat`, `progress`, `summar`, `every \d+
(tool|steps?)`, `keep me posted`, `explain what you're doing`.

**Fix (from the guide).**

```
Before your first tool call, say in one sentence what you're about to do. While working, give a brief update only when you find something important or change direction. When you finish, lead with the outcome: your first sentence should answer "what happened" or "what did you find," with supporting detail after it for readers who want it.
```

To tune narration *up*, the same lever applies in reverse — describe the updates
you want and give positive examples [G] (see D3).

---

## B3 — Written-deliverable length is calibrated

**Opus 5 behavior.** Separate from conversational verbosity: "files that Claude
Opus 5 writes to disk (reports, Markdown documents, summaries) are often longer
than on prior models" [G][M].

**N/A** when the prompt never produces a file or long-form document.

**PASS** — An explicit length-to-substance rule for authored documents.

**PARTIAL** — Conversational conciseness (B1) is set and assumed to cover files,
with no document-specific rule.

**FAIL** — Document-producing prompt with no length calibration.

**Detection.** grep for the file-producing verbs (`write .* to`, `report`,
`document`, `\.md`, `summary file`); if any hit, check for a length rule scoped
to documents rather than to chat replies.

**Fix (from the guide).**

```
Match the length of written documents to what the task needs: cover the substance, but do not pad with filler sections, redundant summaries, or boilerplate.
```

---

## B4 — Correction narration is bounded

**Opus 5 behavior.** Opus 5 "narrates corrections to its earlier statements more
than prior models do, which can be undesirable in user-facing products" [G].

**N/A** for single-turn, non-user-facing prompts.

**PASS** — A rule limiting corrections to those that change the user's code,
conclusions, or decisions.

**PARTIAL** — General "be concise" only, with no correction-specific rule in a
multi-turn user-facing product.

**FAIL** — Multi-turn user-facing prompt with no bound, or one that actively
invites self-critique narration.

**Detection.** grep for: `correct`, `mistake`, `apolog`, `earlier`, `acknowledge`,
`admit`. An invitation to narrate self-critique is as much a FAIL as silence.

**Fix (from the guide).**

```
Only correct an earlier statement when the error would change the user's code, conclusions, or decisions. State corrections plainly and briefly, then continue the task. For slips that change nothing for the user, make the fix and move on without noting it.
```

---

# Group C — Scope and agency

## C1 — Scope contract is explicit

**Opus 5 behavior.** Opus 5 "completes full tasks rather than leaving stubs or
placeholders, and it performs best when given the complete task specification up
front and left to run" [G]. It "can also expand the scope of a task, adding
steps that weren't requested or applying its own judgment about what the task
should be" [G][M].

**PASS** — Scope is bounded in both directions: what is in scope, that the whole
task must be finished, that judgment calls are made in-flight, and that concerns
are voiced without silently reshaping the work.

**PARTIAL** — Bounded one way only (e.g. "don't do extra" but no completeness
requirement, or vice versa).

**FAIL** — A narrow task with no scope bound, on a model that will widen it.

**Detection.** grep for: `scope`, `only`, `do not (add|refactor)`, `finish`,
`complete`, `stub`, `beyond`. Absence of any scope vocabulary on a narrow task
is the FAIL signal.

**Fix (from the guide).**

```
Deliver what was asked, at the scope intended. Make routine judgment calls yourself, and check in only when different readings of the request would lead to materially different work. If the request seems mistaken or a better approach exists, say so in a sentence and continue with the task as asked rather than quietly narrowing, widening, or transforming it. Finish the whole task, and stop short of actions that are clearly beyond what was asked.
```

---

## C2 — No redundant verification scaffolding

**Opus 5 behavior.** "Claude Opus 5 verifies its own work without being told to.
If your prompt contains explicit verification instructions … remove them:
instructions like these cause over-verification on Claude Opus 5, and removing
them reduces wasted tokens with no loss in quality. The same applies to legacy
harness scaffolding that adds separate verification steps" [G]. Separately: it
"catches and fixes its own mistakes well without prompting. Avoid instructing
re-checks it already performs" [G].

**PASS** — No verification, self-check, or re-read-before-answering scaffolding.
Genuine external verification (run the test suite, hit the API) is still fine —
that is tool use, not self-verification.

**PARTIAL** — One residual re-check instruction, or verification framed as
optional.

**FAIL** — "Include a final verification step for any non-trivial task",
"double-check your answer", "re-verify before responding", "use a subagent to
verify" (**BL-2**).

**Detection.** grep for: `double.?check`, `verify (your|the) (work|answer)`,
`re-?verify`, `final verification`, `sanity check`, `review your own`. Triage each
hit: self-directed re-checks are the target; "run the test suite" is not.

**Fix.** Delete the self-verification clause outright — there is no replacement
text, because the behavior it asks for is already the model's default. Keep any
external check (tests, linter, API call) and, if it was tangled into the same
sentence, restate it as plain tool use: "Run `npx playwright test` before
reporting done."

---

## C3 — Subagent delegation is bounded

**Opus 5 behavior.** Opus 5 "delegates to subagents more readily than prior
models. Delegation pays off on genuinely independent, sizeable tracks of work,
but it multiplies cost and time when applied to small tasks" [G][B]. It does
coordinate teams well, "with effective writer-verifier patterns and few cases of
agents overwriting each other's work" — the concern is cost, not competence [G].

**N/A** when the harness has no subagent tool.

**PASS** — Delegation criteria stated, or a deterministic cap set; explicitly
excludes verification subagents and small tasks.

**PARTIAL** — Subagents mentioned with vague guidance ("use them when helpful").

**FAIL** — Subagent-capable, cost-sensitive harness with no guidance; or a
prompt instructing subagent-based verification (also **BL-2**).

**Detection.** grep for: `subagent`, `delegate`, `spawn`, `parallel agents`,
`Task tool`. If the harness exposes a subagent tool but the prompt never names
one of these, the guidance is missing.

**Fix (from the guide).**

```
Delegate to a subagent only for large tasks that are genuinely independent and parallelizable, such as a wide multi-file investigation. Do not delegate work you can finish yourself in a handful of tool calls, and do not use subagents to verify or double-check your own work. If one subagent can complete the task, use one rather than several, and keep spawn counts low.
```

---

# Group D — Specification quality

## D1 — Complete specification, front-loaded

**Opus 5 behavior.** Opus 5 "performs best when given the complete task
specification up front and left to run" [G]. General practice: be clear and
direct, give context and motivation, use XML tags to separate instructions from
data, and set a role [B]. Instruction following stays consistent across the full
**1M-token** context window [G].

**PASS** — Task, inputs, constraints, and a definition of done are all in the
first turn; complex prompts separate instruction / context / data with XML tags;
a role is set where tone or domain matters; non-obvious rules carry their
motivation.

**PARTIAL** — Core task clear but a definition of done, key constraints, or the
input/instruction boundary is missing.

**FAIL** — Task dribbled across turns, or so underspecified that a colleague
with minimal context could not follow it [B].

**Detection.** Run the colleague test [B]: could someone with no context follow
this? Then check for four things by name — the task, its inputs, its
constraints, and a definition of done. Any missing one is at most PARTIAL. In
prompts over ~40 lines, grep for `<` to confirm instructions, context, and data
are tag-separated.

**Fix.** Restructure into labelled sections rather than adding prose. A skeleton
that satisfies D1 for most agentic prompts:

```
<role>Who you are, and what you can and cannot see.</role>

<task>The complete specification, up front — Opus 5 does best given all of it
and left to run.</task>

<constraints>Bounds, non-goals, and the motivation behind any non-obvious
rule.</constraints>

<done>What finished looks like, concretely enough to check.</done>

<input>
[USER: the data goes here, below the instructions]
</input>
```

---

## D2 — Coverage and filtering are separated; bars are concrete

**Opus 5 behavior.** On code review, Opus 5 "finds real bugs at a high rate per
pass, and its additional findings are mostly real issues rather than false
positives" — but "if your review prompt says 'only report high-severity issues'
or 'be conservative,' the model may follow that instruction literally and report
less; ask it to report everything and filter in a separate pass instead" [G].

**N/A** when the task is not find-then-report (review, audit, extraction,
research sweep).

**PASS** — The finding step asks for everything, with per-finding severity and
confidence; filtering is a separate pass or downstream step. Any threshold that
does remain is concrete and measurable.

**PARTIAL** — Report-everything is implied but the prompt still carries a soft
qualitative hedge.

**FAIL** — "Only report important/high-severity issues", "be conservative",
"don't nitpick" inside the finding step (**BL-3**).

**Detection.** grep for: `only report`, `high-severity`, `important`,
`conservative`, `nitpick`, `significant`, `major issues`, `worth mentioning`.
Every hit inside a finding step is a candidate BL-3.

**Fix.** Convert the filter into a coverage instruction plus per-finding
metadata, and move ranking to a second pass. Accuracy holds at lower effort on
Opus 5, "which supports a fast pass at review time and a more thorough pass
later" [G] — a cheap way to run the two passes.

---

## D3 — Positive exemplars over prohibitions

**Opus 5 behavior.** On tuning narration: "Positive examples of the
communication style you want tend to be more effective than instructions about
what not to do" [G]. Generally: tell Claude what to do instead of what not to do
[B], and examples are the most reliable steering lever — relevant, diverse, and
wrapped in `<example>` tags, 3–5 for best results [B].

**N/A** when the prompt specifies no style, tone, or format behavior at all —
there is nothing framed by negation to correct. (Missing style guidance is
scored by B1/B2/D1, not here.)

**PASS** — Style, tone, and format are shown with at least one concrete positive
example; necessary prohibitions are each paired with their replacement.

**PARTIAL** — Mostly positive framing but the key style rule is still stated as
a negation.

**FAIL** — Behavior specified mainly by a list of don'ts, with no exemplar of
the target.

**Detection.** grep for: `do not`, `don't`, `never`, `avoid`, `no `. Count them
against the number of `<example>` blocks; a prohibition-heavy prompt with zero
exemplars fails.

**Fix.** Invert each prohibition into the behavior you want, and show one
instance of it. "Don't be verbose" becomes a sample answer at the target length;
"no bullet lists" becomes "write in flowing prose paragraphs" [B]. Where a
prohibition must stay, attach its replacement in the same sentence: "use plain
language; define any technical term you do need on first use." Wrap exemplars in
`<example>` tags so they read as illustrations rather than instructions [B].

---

## D4 — Tool and environment contract

**Opus 5 behavior.** Vision performance "is strongest when the model has tools to
iteratively analyze, crop, and visually verify its work, and tool use is a more
cost-effective lever than thinking alone" [G]. Effort shapes tool-call volume:
lower effort means fewer calls [E]. General practice: say explicitly when to use
each tool, state action-vs-suggest posture, and instruct parallel calls for
independent operations [B].

**N/A** for non-tool prompts.

**PASS** — Each tool has stated trigger conditions; the prompt says what the
agent can and cannot see; action-vs-suggest posture is explicit; independent
calls are instructed to run in parallel.

**PARTIAL** — Tools listed without triggers, or posture left implicit.

**FAIL** — Tool-dependent task with no tool guidance; or aggressive
over-prompting ("CRITICAL: you MUST always use this tool") that now overtriggers
[B].

**Detection.** For each tool in the harness, grep the prompt for its name. A tool
with no mention, or a mention with no trigger condition, is the gap. Also grep
for `CRITICAL`, `MUST`, `ALWAYS`, `if in doubt` — over-prompting is now its own
failure mode.

**Fix.** Give each tool one line of when-and-why, state the visibility boundary,
and set the action posture:

```
<tools>
- read_file: inspect every file that imports the module before editing, to find
  all affected call sites.
- web_search: when a referenced API's current replacement is uncertain.
You can see the repo; you cannot see runtime logs or CI — ask if you need them.
By default implement changes rather than only suggesting them.
If several tool calls are independent, make them in parallel.
</tools>
```

---

## D5 — Eval-gated, not vibes-gated

**Opus 5 behavior.** The guide conditions nearly every recommendation on your own
evals: "adjust based on your evals", "use `low` and `medium` liberally … wherever
quality holds", "if you carried effort defaults over from a prior model, re-run
an effort sweep on your own evals" [G][E][M]. Also: "Re-validate any prompt-side
vision workarounds you tuned for prior models; they may no longer be needed" [G].

**PASS** — Success criteria are named, a test set or eval hook exists, and any
migrated prompt records that an effort sweep and a workaround re-validation are
pending or done.

**PARTIAL** — Success criteria stated but no eval or sweep plan.

**FAIL** — No success criteria, and prior-model tuning carried forward untested
(**BL-5**).

**Detection.** grep for: `eval`, `test set`, `success`, `criteria`, `measure`,
`baseline`, `sweep`. Separately, ask whether any number in the prompt or its
config (effort, `max_tokens`, thresholds) was chosen for an earlier model.

**Fix.** This one usually lives in the runtime note, not the prompt body —
unless the prompt itself defines the eval. Name the success criteria, point at a
test set, and record the two open re-validations:

```
Success criteria: <what a good output does>
Test set: <n cases, including the edge cases that broke before>
Pending: fresh effort sweep (low → max); re-validate prompt-side vision
workarounds carried over from an earlier model.
```

---

## Migration quick-check (Opus 4.8 → Opus 5)

Run whenever the source prompt or harness targeted Opus 4.8 or earlier. All from
[M] unless noted.

| Check | Action |
|---|---|
| Model ID | `claude-opus-4-8` → `claude-opus-5` (fixed ID, no date suffix) |
| No `thinking` field | Now runs **with** adaptive thinking — revisit `max_tokens` |
| `thinking: disabled` + `xhigh`/`max` | **400** — re-enable thinking or drop effort to `high` or below |
| `budget_tokens` | Remove — 400 on Claude 4.7 and later [B] |
| Effort carried over | Re-sweep; test `low`/`medium` as cost controls and `max` for capability-critical work |
| `max_tokens` at `xhigh`/`max` | Raise to ≥ 64k [E] |
| Verbosity prompts | Re-tune: responses and written deliverables both run longer |
| Verification / self-check instructions | Remove — cause over-verification |
| Narrow tasks | Add an explicit scope bound |
| Subagent frameworks | Add delegation criteria or a spawn cap |
| Vision workarounds | Re-validate; may be unnecessary |
| Prompt caching | Minimum drops to 512 tokens — short prompts can now cache |
| Refusals | Handle `stop_reason: "refusal"`; consider `fallbacks: "default"` (beta, header `server-side-fallback-2026-07-01`) |
| Priority Tier | Not supported on Opus 5 — plan capacity separately |
| Tool list changes mid-conversation | Beta header `mid-conversation-tool-changes-2026-07-01` preserves cache hits |
