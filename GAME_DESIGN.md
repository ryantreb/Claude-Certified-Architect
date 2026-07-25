# PROJECT DESIGN DIRECTIVE

Create an original 2D tactical fantasy RPG that captures the design grammar and overall experience of early browser-based tactical RPGs such as Dragon Age Legends and Dragon Age Journeys.

This is an inspiration reference, not a recreation.

Do not copy proprietary characters, factions, place names, storylines, dialogue, creatures, item names, interface assets, icons, maps, sound effects, music, or exact screen layouts. Create an original setting, visual identity, lore, terminology, and content.

The goal is to reproduce the qualities that made the reference compelling:

- Compact but strategically meaningful battles
- Clear turn-order manipulation
- Strong class identities
- Readable 2D presentation
- Short play sessions
- A persistent hero and party
- A quest-map progression layer
- A headquarters and crafting layer
- Dark fantasy with personality, humor, and adventurous momentum

---

# 1. PRODUCT VISION

Build a party-based tactical RPG designed around 5-to-15-minute sessions.

The game should feel:

- Tactical without being slow
- Dark without being joyless
- Accessible without being simplistic
- Stylized rather than realistic
- Heroic, dangerous, slightly pulpy, and occasionally humorous
- Like a substantial RPG condensed into a focused format

The player should regularly make meaningful decisions about:

- Which characters to deploy
- Which enemy to disable or eliminate first
- When to spend mana or consumables
- Whether to protect, heal, reposition, or attack
- How to manipulate the upcoming turn order
- Whether to conserve resources for later encounter waves

The primary design test is:

“Can the player understand the immediate tactical problem within five seconds, but still discover a better solution after thinking about it?”

---

# 2. CORE GAME LOOP

Use three interconnected gameplay pillars:

## Quest

The player travels through a node-based regional map.

Nodes may contain:

- Story encounters
- Tactical battles
- Elite encounters
- Treasure
- Merchants
- Rest locations
- Decisions
- Optional challenges
- Boss battles

The map should resemble a compact adventure board rather than an open world.

Completing nodes unlocks branching routes, locations, lore, resources, recruits, and equipment.

## Combat

Battles are compact, turn-based tactical encounters involving a small party and a clearly visible enemy formation.

Combat should be the primary source of mastery and player expression.

## Headquarters

Between quests, the player returns to a castle, keep, camp, guildhall, ship, or equivalent headquarters.

The headquarters supports:

- Consumable crafting
- Equipment management
- Character development
- Recruit management
- Facility upgrades
- Story conversations
- Research or training
- Preparation for the next expedition

The headquarters must support combat rather than becoming an unrelated construction simulator.

---

# 3. COMBAT STRUCTURE

## Party size

Use a default party of three active characters.

A typical party should support recognizable tactical roles:

- Durable front-line protector
- Mobile or ranged damage dealer
- Mage, healer, summoner, controller, or support specialist

Do not require the traditional tank-damage-healer composition. Alternative parties must remain viable through abilities, equipment, consumables, and status interactions.

## Battlefield

Present combat from a side-facing or slightly elevated 2D perspective.

Use a small number of discrete positions or rows rather than unrestricted grid movement.

Recommended initial implementation:

- Two rows or lanes for the player
- Two rows or lanes for enemies
- One character per position
- Abilities may target the same row, an adjacent row, an entire row, or any position
- Melee attacks are strongest against appropriate nearby targets
- Ranged attacks have broader targeting
- Some abilities pull, push, swap, guard, intercept, or reposition units

Positioning must matter, but movement must not dominate the battle.

## Initiative timeline

Display the upcoming action sequence prominently along the bottom or side of the battlefield.

Each character has an initiative or agility value that determines how quickly their next action arrives.

The timeline should show:

- Current actor
- At least the next six scheduled actions
- Friendly and enemy portraits
- Status effects that delay or accelerate turns
- Previewed timeline changes before the player confirms an ability

Initiative must be a manipulable tactical system.

Abilities may:

- Delay an enemy
- Advance an ally
- Grant an immediate follow-up action
- Interrupt a cast
- Stun an enemy for one scheduled action
- Increase or reduce initiative temporarily
- Insert a summoned unit into the sequence

Avoid conventional round-based messaging when the timeline is more important than the abstract round count.

## Turn flow

On a character’s turn:

1. Highlight the active character.
2. Display valid abilities and items.
3. Preview valid targets.
4. Show predicted damage, resource cost, status chance, and timeline effects.
5. Allow the player to confirm or cancel.
6. Play a short, readable animation.
7. Apply results.
8. Advance immediately to the next timeline entry.

Most normal actions should resolve in approximately one to two seconds.

---

# 4. COMBAT VARIABLES

Keep numbers small and readable.

## Health

Use segmented health rather than large numerical health pools.

Examples:

- Health pips
- Wound segments
- Armor and vitality blocks
- Small values such as 6 to 20 maximum health

Damage should remain understandable without requiring floating-point calculations or very large numbers.

## Core statistics

Start with a limited set of comprehensible statistics:

- Power: physical or general attack strength
- Guard: physical defense
- Focus: spell power or ability effectiveness
- Resistance: defense against magic and conditions
- Agility: initiative frequency and evasion
- Fortune: critical hits, fumbles, and loot outcomes

Every statistic must have a visible and testable effect.

Do not create numerous statistics that differ only slightly.

## Resources

Possible character resources include:

- Mana
- Stamina
- Ability charges
- Cooldowns
- Consumable inventory
- Summon limits

Characters should not all use the same resource system.

## Accuracy and uncertainty

Combat may include:

- Hits
- Misses
- Critical hits
- Fumbles
- Resisted effects
- Grazing attacks

Randomness must create tension without invalidating planning.

Always display the approximate likelihood of uncertain outcomes.

Use seeded randomness so combat bugs and balance problems can be reproduced.

---

# 5. ABILITIES AND STATUS EFFECTS

Abilities should be concise, strongly differentiated, and immediately legible.

A good ability changes at least one of the following:

- Health
- Position
- Initiative
- Resource availability
- Target access
- Defense
- Status
- Number of battlefield units

Core status categories:

- Stun: loses the next scheduled action
- Root: cannot change position
- Silence: cannot use magical abilities
- Disarm: cannot use weapon abilities
- Guarded: damage is redirected or reduced
- Hidden: cannot be selected by some attacks
- Exposed: receives increased damage
- Burning or bleeding: damage over scheduled actions
- Slowed: next action is delayed
- Hastened: next action arrives sooner
- Drained: loses mana or stamina
- Marked: enables class or party synergies

Avoid stacking numerous minor percentage modifiers.

Prefer visible, categorical effects that change decisions.

---

# 6. CLASS DESIGN

Begin with three broad archetypes, but allow substantial specialization.

## Warrior

Core identity:

- Protection
- Interception
- Stunning
- Armor
- Reliable melee pressure

Possible branches:

- Guardian
- Berserker
- Weapon master
- Commander

## Rogue

Core identity:

- Speed
- Ranged or precision damage
- Stealth
- Critical attacks
- Debuffs and turn manipulation

Possible branches:

- Archer
- Assassin
- Duelist
- Saboteur

## Mage

Core identity:

- Mana management
- Area effects
- Control
- Summoning
- Healing or support

Possible branches:

- Elementalist
- Spirit healer
- Summoner
- Hexer

Each class must have:

- A distinct resource pattern
- At least one defensive strategy
- At least one control option
- At least one party-synergy mechanic
- Multiple viable talent paths
- A recognizable visual silhouette

Talent choices should alter play style rather than merely adding small statistical bonuses.

---

# 7. ENCOUNTER DESIGN

Treat each battle as a tactical puzzle.

Enemy groups should combine roles such as:

- Front-line blocker
- Fragile ranged attacker
- Healer
- High-priority spellcaster
- Fast flanker
- Summoner
- Armored elite
- Creature with unusual targeting rules

Use multi-wave battles selectively.

Later waves should create tension because the player does not automatically recover all health, mana, ability charges, or consumables between waves.

Good encounter questions include:

- Can the player reach the enemy caster behind the defender?
- Should the player spend a bomb now or save it for the next wave?
- Can initiative manipulation prevent a dangerous enemy action?
- Should a wounded character attack, defend, retreat, or consume an item?
- Can the party exploit row placement or resistance weaknesses?
- Is eliminating one enemy better than damaging several?

Avoid encounters that are solved by repeatedly using the highest-damage ability.

---

# 8. CONSUMABLES

Consumables should be strategically important but not mandatory in every routine battle.

Examples:

- Healing draught
- Mana restorative
- Smoke bomb
- Fire bomb
- Armor-breaking flask
- Initiative tonic
- Antidote
- Temporary ward
- Summoning object

Bombs and combat items should consume a character action unless an item explicitly grants a bonus action.

The player must be able to understand why an item is valuable before entering combat.

Do not sell consumables through real-money microtransactions.

---

# 9. EQUIPMENT AND LOOT

Use a curated loot system rather than a flood of procedurally generated trash.

Equipment should have:

- A clear mechanical purpose
- A strong silhouette
- One or two memorable properties
- A short piece of lore
- Evidence of use, ownership, age, or history

An item should feel like an artifact from the world, not merely a statistical container.

Prefer:

“An old silver charm that delays the first hostile spell each battle.”

Over:

“Rare Amulet of Spell Resistance +4.7%.”

Use visual storytelling:

- Broken engravings
- Trophy teeth
- Old blood stains
- Repairs
- Family crests
- Monster fragments
- Religious symbols
- Unusual materials
- Signs of previous owners

Reserve generic loot for crafting materials and common supplies.

---

# 10. HEADQUARTERS AND CRAFTING

The headquarters should create a satisfying preparation loop.

Possible facilities:

- Apothecary
- Smithy
- Training yard
- Library
- Infirmary
- Barracks
- Trophy hall
- Enchanter’s workshop

Upgrades may:

- Unlock new recipes
- Improve production efficiency
- Increase storage
- Unlock talents
- Reveal enemy information
- Attract new recruits
- Provide limited expedition bonuses

Do not use multi-hour real-time waiting as the primary progression mechanic.

Use one of these alternatives:

- Production completes after quest nodes
- Facilities gain one production cycle after each battle
- The player assigns limited workers before an expedition
- Crafting consumes resources immediately
- Long projects advance through meaningful gameplay milestones

The castle should reward planning, not inactivity.

---

# 11. QUEST AND STORY TONE

Create an original dark-fantasy world with accumulated history.

The setting should contain:

- Fallen roads and abandoned strongholds
- Old noble or guild rivalries
- Cults, demons, monsters, or supernatural corruption
- Relics whose significance predates the protagonist
- Communities surviving beside ancient dangers
- Political disputes with no completely clean solution
- Heroes who are capable but not invulnerable

The narrative voice should be economical.

Use short dialogue scenes, illustrated character portraits, location cards, item descriptions, and brief decisions rather than lengthy cinematic sequences.

The tone should combine:

- Serious stakes
- Mythic heroism
- Gruesome details
- Dry humor
- Colorful companions
- Occasional absurdity
- Consequences and sacrifice

Do not make every line solemn or archaic.

The world may be grim, but the act of adventuring should remain energetic and enjoyable.

---

# 12. VISUAL DIRECTION

Use polished, stylized 2D artwork.

## Characters

Characters should have:

- Strong silhouettes
- Slightly exaggerated proportions
- Clearly visible weapons
- Recognizable class colors and shapes
- Expressive combat poses
- Limited but high-quality animation
- Distinct idle stances

Avoid photorealism, chibi proportions, generic anime presentation, or overly smooth 3D mobile-game rendering.

## Environments

Use layered, hand-painted or painterly backgrounds.

Locations may include:

- Dense forests
- Mountain roads
- Ruined keeps
- Caverns
- Ancient vaults
- Villages
- Cult sanctuaries
- Battle-scarred courtyards

Backgrounds should be atmospheric without competing with combatants.

Characters and interactive elements must have stronger contrast than the environment.

## Palette

Use a grounded fantasy palette:

- Moss green
- Mud brown
- Weathered stone
- Tarnished gold
- Dark iron
- Desaturated cloth
- Deep red
- Arcane blue, violet, or green for magical effects

Reserve bright saturation for:

- Spells
- Status effects
- Critical attacks
- Selected characters
- Important loot
- Interactive UI states

## Interface

The interface should feel like an illustrated fantasy game panel, not a modern productivity dashboard.

Use:

- Carved, weathered, metallic, leather, stone, or parchment framing
- Large readable ability icons
- Strong selected-state highlighting
- Portrait-based initiative indicators
- Clearly separated health and resource pips
- Minimal text during battle
- Tooltips with exact mechanical information
- A persistent but compact action area

The battlefield should occupy most of the screen.

Do not bury combat underneath menus.

---

# 13. ANIMATION AND FEEDBACK

Combat animation should be fast, exaggerated, and readable.

Each action needs:

- Anticipation
- Impact
- Reaction
- Immediate mechanical feedback

Use:

- Short lunges rather than long traversal animations
- Hit flashes
- Screen shake only for major impacts
- Distinct critical-hit feedback
- Clear miss and resistance feedback
- Small status icons
- Brief floating values
- Strong but short spell effects
- Character barks or battle cries for exceptional moments

Allow animations to be accelerated or skipped.

Avoid long cinematic ability sequences during routine battles.

---

# 14. SOCIAL FEATURES

Social systems are optional.

The original appeal of using friends as party members may be adapted through:

- Shareable hero codes
- Asynchronous companion borrowing
- AI-controlled versions of another player’s hero
- Challenge arenas
- Guild or community objectives
- Leaderboards
- Daily seeded encounters

The complete campaign and progression loop must work offline and in single-player mode.

Never make social participation necessary to obtain core characters, abilities, endings, or story content.

---

# 15. ENGINEERING GUIDELINES

Build the game systems in a data-driven and testable manner.

## Combat data

Define characters, enemies, abilities, items, status effects, encounters, and talent trees in external data files or structured resources.

Avoid hard-coding individual abilities into the combat controller.

Each ability definition should support fields such as:

- Identifier
- Display name
- Description
- Target rules
- Range or valid rows
- Resource cost
- Damage formula
- Status effects
- Initiative modification
- Cooldown
- Animation identifier
- AI utility tags

## Combat state

Use a deterministic combat state machine.

Suggested phases:

- Encounter initialization
- Wave initialization
- Turn selection
- Player or AI decision
- Target validation
- Action preview
- Action resolution
- Trigger resolution
- Defeat checks
- Timeline update
- Wave completion
- Encounter completion

Prevent input while an action is being resolved.

## Initiative

Represent the initiative timeline as an ordered priority queue.

All initiative changes must produce predictable queue updates.

Create automated tests for:

- Tied initiative values
- Stuns
- Extra turns
- Delays
- Speed buffs
- Summoned units
- Dead characters still present in the queue
- Wave transitions

## Save system

Store:

- Hero state
- Party roster
- Talents
- Equipment
- Inventory
- Headquarters upgrades
- Quest-map progress
- Decisions
- Random seed where relevant

Version the save format from the beginning.

## Accessibility

Support:

- Scalable interface text
- Keyboard and controller navigation
- Reduced motion
- Color-blind-safe status differentiation
- Combat log
- Ability tooltips
- Adjustable animation speed
- Confirmation options for scarce consumables

---

# 16. ANTI-GOALS

Do not build:

- A real-time action RPG
- An open-world exploration game
- A gacha or hero-collection economy
- A clicker or idle game
- A loot system built around thousands of nearly identical items
- A battle system with enormous health and damage numbers
- A system where character level overrides tactical decisions
- A mandatory online game
- Real-time crafting timers
- Energy systems that stop the player from continuing
- Spam-based friend recruitment
- Direct copies of Dragon Age content or interface assets
- A visually generic mobile RPG

---

# 17. MVP IMPLEMENTATION ORDER

Develop in this order:

1. One complete three-versus-four combat encounter
2. Initiative timeline and turn manipulation
3. Rows, targeting, melee, ranged attacks, and positioning
4. Three playable classes
5. Status effects and consumables
6. Multi-wave encounters
7. Enemy AI
8. Talent progression
9. Quest map
10. Headquarters and crafting
11. Equipment and inventory
12. Narrative content
13. Save system
14. Visual and audio polish
15. Optional asynchronous social systems

Do not implement the headquarters, multiplayer, or a large campaign until the combat vertical slice is fun.

---

# 18. VERTICAL-SLICE ACCEPTANCE CRITERIA

The initial vertical slice is successful when:

- A new player understands the basic controls without external instructions.
- The upcoming turn sequence is always visible.
- The player can alter the timeline using at least two abilities.
- Row placement changes damage, targeting, or defense.
- The three classes feel mechanically distinct.
- Stun, guard, stealth, damage-over-time, and one movement effect work.
- At least one enemy must be controlled before it acts.
- At least one encounter contains two waves.
- Consumable use creates a meaningful tradeoff.
- A typical battle lasts five to eight minutes.
- Animations communicate outcomes without delaying play.
- The same battle can be replayed from a fixed random seed.
- Victory depends more on decisions than character level.
- All game content uses original names, artwork, lore, and assets.