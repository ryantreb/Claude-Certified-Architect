# Sigilbound Combat

Sigilbound combat turns certification recall into the condition that resolves tactical choices. Player intent is visible before recall, but no combat effect occurs until recall is judged.

## Language

**Action Intent**:
A hotbar action and target the player has selected but which have not yet affected combat. The player chooses both before the knowledge gate appears. The intent becomes a resolved action only after its question is answered.
_Avoid_: Action, completed action, earned action

**Knowledge Gate**:
The question triggered by an action intent. A correct answer resolves the intended effect; a wrong answer resolves a failed attempt and passes the turn without spending mana or consumables.
_Avoid_: Prerequisite question, action reward

**Resolved Action**:
The combat outcome produced after a knowledge gate is judged. It either applies the intended effect on a correct answer or applies the action's failure outcome on a wrong answer.
_Avoid_: Selected action, action intent

**Region Recall Pool**:
The certification concepts eligible to appear as knowledge gates in the active region. Action intents never change or bypass this pool.
_Avoid_: Action question pool, skill questions

**Adaptive Recall**:
Automatic selection of question depth from the player's mastery and current region progression. Combat does not expose “Standard Recall” or “Deep Recall” choices; hotbar actions express tactical intent only.
_Avoid_: Recall action, difficulty button, attack difficulty

**Active Combatant**:
The one living party member whose personal attacks and spells currently occupy the hotbar. Outside targeting mode, tapping a living player character makes them active and marks them with a bright gold ring. Selecting another living party member does not spend the turn; shared item slots remain fixed. During targeting mode, tapping a player character selects them as the target instead.
_Avoid_: Current turn, selected action, party leader

**Roll Resolution**:
An optional global combat rule controlled by the settings-only “D20 Combat Rolls” toggle, disabled by default. Setting changes apply to the next action and never alter an action already in progress. When disabled, a correct answer makes the intended action succeed or fully defends the incoming attack. When enabled, a correct answer earns the relevant attack or defense roll; a wrong answer still fails the action or defense before any roll.
_Avoid_: Question difficulty, dice question, guaranteed hit

**Battlefield D20**:
A clickable 3D pixel-art twenty-sided die presented on the battlefield after the player continues from correct answer feedback when Roll Resolution is enabled. Clicking it triggers a visible rolling animation that settles on a number, followed by an energetic comic result burst such as “18! HIT!” or “6! BLOCK BROKEN!” The result then automatically plays the corresponding combat animation without another Continue action. The die never appears inside the question panel.
_Avoid_: Question die, automatic roll, flat dice button

**Combat Hotbar**:
A persistent five-slot image control containing Basic Attack, Skills/Spells, Poultice, Mana Draught, and Utility. Its positions do not change when the active combatant changes. Unaffordable spells and empty item slots are visibly disabled before selection, using small quantity or cost badges rather than text labels; resources are deducted only after a correct answer. In restricted examination modes, prohibited item slots remain in place under a visible crossed-chain seal.
_Avoid_: Action card, question actions, combat menu

**Ability Tray**:
A compact secondary chooser opened from the Skills/Spells hotbar slot. It contains only the active combatant's available abilities and closes after an ability is selected or the player dismisses it.
_Avoid_: Second hotbar, question menu, inventory

**Item Tray**:
A compact image-only chooser opened from the Utility hotbar slot. It contains available combat utility items, beginning with the Clay Bomb, and closes after an item is selected or the player dismisses it.
_Avoid_: Inventory screen, second hotbar, item card

**Hotbar Iconography**:
A cohesive pixel-art image family created specifically for the Combat Hotbar using the game's existing palette. The core symbols are Sword, Spellbook/Rune, Poultice, blue Mana Draught, and Utility Satchel/Bomb. Slots contain no visible action names; small numeric badges communicate cost or quantity, with accessible names and tooltips supplied outside the artwork.
_Avoid_: Emoji actions, text buttons, cropped character art

**Mana Bar**:
A blue resource bar displayed above each player character's head, immediately below that character's hearts. It is battlefield status, not a hotbar action; the Mana Draught remains the action used to restore it.
_Avoid_: Mana button, mana slot, magic health

**Targeting**:
The step between choosing a targeted hotbar action and opening its knowledge gate. The player selects among valid battlefield targets; when exactly one valid target exists, the game selects it automatically and opens the knowledge gate.
_Avoid_: Answer target, question target, action resolution

**Question Panel**:
A temporary comic-book-styled overlay that exists only while presenting a knowledge gate and its answer feedback. Its height follows its content with no fixed minimum, up to a viewport limit; long content scrolls internally while essential controls remain visible. The battlefield and hotbar remain visible but dimmed and disabled behind it, while the selected action and target remain subtly highlighted. It has no minimize control and disappears completely after the player continues, returning the full battlefield and combat hotbar.
_Avoid_: Combat card, action card, minimized card

**Region Mark**:
A unique color and small sigil carried on the edge of each question panel to identify its Region Recall Pool at a glance. It replaces the long area and category metadata; a short topic tag such as “Loop Control” appears only in the answer-feedback footer.
_Avoid_: Region heading, area sentence, oversized category label

**Comic Typography**:
Display lettering reserved for threat callouts, compact headers, and outcome words such as “Correct!” or “Miss!” Questions, answer choices, explanations, and examples use one consistent high-legibility typeface and fixed reading size across every region and combat mode.
_Avoid_: Comic body copy, per-question font scaling, oversized metadata

**Answer Feedback**:
The right-or-wrong result, short reviewed explanation, and concrete reviewed example stored with and shown for every question. Feedback is authored as part of the region recall data rather than generated at runtime. The combat outcome is determined when the answer is chosen, but its animation waits until the player presses Continue and the panel closes. Using a hint may reduce learning or mastery rewards but never weakens the combat result of a correct answer.
_Avoid_: Combat result, attack animation, answer toast

**Failure Beat**:
An action-specific comic animation played after Continue for a wrong answer: “WHIFF!” for attacks, “FIZZLE!” for spells, “NOPE!” with an item bouncing back into its slot for consumables, and “KRAK!” when a failed defense allows the enemy hit. Unspent items visibly return to the hotbar.
_Avoid_: Generic wrong animation, consumed failure, silent miss

**Impact Effect**:
A target-aware burst synchronized to a connected hit. Player characters and organic enemies use a sharp, directional red blood spray inspired by the original Dragon Age Legends combat presentation; metal, stone, and other non-organic targets use sparks, dust, chips, or suitable magical particles instead. The current runtime VFX library has no standalone reusable blood sprite, so the blood effect is recreated as matching pixel art.
_Avoid_: Blood on constructs, generic impact flash, persistent gore decal

**Threat Callout**:
An energetic comic-book announcement shown on the battlefield for about one second before an enemy defense knowledge gate, naming the targeted party member, attacking enemy, and incoming move—for example, “Defend Aria from Scopecreep's Overrun!” It automatically advances into the question without another tap, and its context is not repeated as descriptive copy inside the question panel.
_Avoid_: Defense-card header, enemy metadata, combat log
