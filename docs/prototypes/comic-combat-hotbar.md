# Comic combat hotbar prototype

Status: accepted and implemented in the production combat path. Variant C's speech stack, action-first knowledge gate, battlefield hotbar, optional d20, defense callout, per-character mana, rigged resolution animations, and target-aware impact effects now run without a prototype query flag. The throwaway route, losing variants, and evaluator were removed when production work began; the descriptions below are retained only as the design record.

Question: which comic-book presentation best communicates the agreed Action Intent → Targeting → Knowledge Gate → Answer Feedback → Resolved Action flow without obscuring the battlefield?

The three throwaway variants were reviewed on the app route behind `?prototype=hotbar`:

- `variant=A`: centered splash panel
- `variant=B`: content-sized edge panel
- `variant=C`: speech-balloon stack

Use the bottom evaluator bar or the Left and Right arrow keys to switch variants. Its D20 control is prototype-only; the production rule remains a settings-only toggle, disabled by default.

Verdict: variant C, the speech-balloon stack, is the selected direction. Its post-answer verdict, explanation, example, mastery tag, and Continue action must remain part of that same comic-book visual language rather than collapsing into a conventional information card. Delete the losing variants and evaluator bar when production work begins; rewrite C as production code rather than promoting this prototype directly.

Timing note: the incoming-defense comic callout that follows an action resolution remains visible for 5 seconds before its knowledge gate opens. Full character strike rigs are intentionally outside this UI prototype; it demonstrates CSS hit reactions, misses, and impact effects only.
