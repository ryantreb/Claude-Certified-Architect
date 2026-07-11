# Art asset inventory — Sigilbound `index.html`

All art is embedded as base64 data URIs inside `index.html` (no external image files are
loaded by the game). Total: **3,755 images, ~40 MB decoded**. `mobile/` is generated from
`index.html` by `tools/build-mobile.py` and inherits whatever is embedded — it is not an
independent asset set. `reference/dalegends/` is the extraction reference, not used at runtime.

| Store | Images | Type | Formats | Alpha | Notes |
|---|---|---|---|---|---|
| `DATA.eaRig` | 3340 | Animation-frame sequences | WEBP | 3340/3340 | 45 characters × 4–8 anims (idle/strike/dmg/death/fwd/special/evade/block); each frame has per-frame x/y registration offsets; 34 embedded portraits ride along |
| `DATA.eaFx` | 224 | Animation-frame sequences | WEBP | 224/224 | 20 effect sets (fireball, bolt, lightning, frost, heal, buff, banner text) |
| `DATA.eaBg` | 54 | Layered battle backdrops | WEBP | 54/54 | 18 environments × 3 parallax layers (bg/mid/fg), fg+mid are alpha cutouts |
| `DATA.eaMap` | 44 | Overworld map paintings | WEBP | 0/44 | 7 regions (PP/PF/GD/WS/OR/WC/KW), 1200–2700 px, opaque |
| `DATA.sprites` | 29 | Standalone sprite frames | PNG | 29/29 | player-provided hero/enemy sprites: warrior, wizard, rogue, ranger + 15 monsters/props; 1–3 frames each, PNG alpha |
| `DATA.terrain` | 10 | Seamless ground tiles | JPEG | 0/10 | 10 tiling 512×512 JPEG textures, tiled in world space by chunk painter |
| `DATA.eaRooms` | 10 | Standalone UI images | WEBP | 10/10 | Kaiten Castle room illustrations, 420 px wide, alpha |
| `DATA.props` | 8 | Standalone sprites | WEBP | 8/8 | landmark set-pieces (mountain, tower, monolith…), ~360 px tall, alpha |
| `DATA.eaComp` | 20 | Portrait icons | WEBP | 1/20 | companion portraits 50×50 / 80×80, opaque |
| `DATA.eaPartIcon` | 7 | UI icons | WEBP | 7/7 | resistance icons ~87 px, alpha |
| `DATA.eaVillainPort` | 5 | Portraits | WEBP | 5/5 | villain portraits, 140 px wide, alpha |
| `DATA.eaWorldMap` | 3 | UI images | WEBP | 2/3 | world-map backdrop + node + castle marker |
| `DATA.heroImg` | 1 | Standalone image | PNG | 1/1 | single 324×340 hero PNG with alpha |

## Replacement status (high-fantasy cel-shaded restyle)

- **Replaced: 181 static images** — all `sprites` (29), `eaBg` (54), `eaRooms` (10), `props` (8),
  `terrain` (10), `eaComp` (20), `eaPartIcon` (7), `eaVillainPort` (5), `eaWorldMap` (3),
  `heroImg` (1), plus all 34 `eaRig` character portraits (including the 4 hero `*Std` variants).
- **Skipped: 3,574 images**, kept as original EA art:
  - **3,306 `eaRig` animation frames + 224 `eaFx` effect frames** — these are baked per-frame
    bitmaps carrying `x/y` registration offsets and action-frame timing, not a redrivable
    part-based rig. Independent per-frame regeneration would desync animation registration and
    break combat, so they were skipped per the "skip it and report why" rule rather than broken.
  - **44 `eaMap` overworld region paintings** — large multi-thousand-pixel scans; out of the
    available image-generation budget this pass.

## Per-asset detail

Full machine-readable catalog: `docs/art-inventory.csv` (group, key path, format, WxH, alpha, bytes).

### `DATA.eaRig` — 45 characters (3,306 anim frames + 34 portraits)

| Character | Frames | Animations | Frame box (w×h) |
|---|---|---|---|
| genlock | 49 | death(11), dmg(7), idle(17), strike(14) | 121×103 (varies) |
| shadeDemon | 66 | death(18), dmg(12), idle(15), strike(21) | 168×140 (varies) |
| golem | 51 | death(10), dmg(7), idle(20), strike(14) | 234×154 (varies) |
| corpse | 46 | death(13), dmg(10), idle(13), strike(10) | 65×112 (varies) |
| spiders | 68 | death(13), dmg(8), idle(38), strike(9) | 164×105 (varies) |
| ogre | 57 | death(16), dmg(13), idle(14), strike(14) | 192×296 (varies) |
| skeleton | 41 | death(8), dmg(10), idle(12), strike(11) | 75×115 (varies) |
| rageDemon | 54 | death(14), dmg(11), idle(19), strike(10) | 188×139 (varies) |
| desire | 74 | idle(19), strike(17), dmg(14), death(10), fwd(14) | 61×126 (varies) |
| deepstalker | 57 | death(14), dmg(14), idle(15), strike(14) | 73×32 (varies) |
| bronto | 44 | death(11), dmg(7), idle(12), strike(14) | 245×198 (varies) |
| dragon | 66 | death(9), dmg(10), idle(27), strike(20) | 527×295 (varies) |
| arcaneHorror | 63 | idle(14), strike(20), dmg(9), death(8), fwd(12) | 80×124 (varies) |
| deymour | 80 | fwd(15), death(24), dmg(9), idle(11), strike(21) | 195×169 (varies) |
| shale | 61 | idle(20), dmg(8), death(15), strike(18) | 79×122 (varies) |
| tianne | 91 | death(19), dmg(9), idle(25), strike(38) | 218×200 (varies) |
| soleil | 80 | death(29), dmg(6), idle(21), strike(24) | 76×162 (varies) |
| beirus | 93 | death(38), dmg(12), idle(15), strike(28) | 287×209 (varies) |
| mabari | 57 | death(11), dmg(8), idle(20), strike(18) | 89×81 (varies) |
| heroWar | 89 | idle(12), strike(13), special(14), dmg(10), death(12), fwd(12), evade(9), block(7) | 105×122 (varies) |
| heroRog | 87 | idle(13), strike(13), special(14), dmg(10), death(12), fwd(12), evade(9), block(4) | 65×116 (varies) |
| heroMag | 95 | idle(12), strike(17), special(15), dmg(10), death(12), fwd(11), evade(10), block(8) | 79×127 (varies) |
| heroArc | 97 | idle(12), strike(16), special(14), dmg(11), death(12), fwd(12), evade(11), block(9) | 78×114 (varies) |
| heroRog2 | 87 | idle(13), strike(13), special(14), dmg(10), death(12), fwd(12), evade(9), block(4) | 188×40 (varies) |
| heroMag2 | 95 | idle(12), strike(17), special(15), dmg(10), death(12), fwd(11), evade(10), block(8) | 81×127 (varies) |
| raspin | 59 | idle(13), strike(11), dmg(11), death(12), fwd(12) | 188×35 (varies) |
| bandit1H | 59 | idle(13), strike(11), dmg(11), death(12), fwd(12) | 186×56 (varies) |
| banditMage | 62 | idle(12), strike(17), dmg(10), death(12), fwd(11) | 148×111 (varies) |
| banditBow | 63 | idle(12), strike(16), dmg(11), death(12), fwd(12) | 79×114 (varies) |
| hurlock1H | 68 | idle(16), strike(12), dmg(14), death(15), fwd(11) | 75×121 (varies) |
| hurlock2H | 71 | idle(17), strike(15), dmg(9), death(17), fwd(13) | 138×116 (varies) |
| hurlockStaff | 72 | idle(20), strike(21), dmg(9), death(9), fwd(13) | 141×141 (varies) |
| carta2H | 62 | idle(12), strike(15), dmg(10), death(13), fwd(12) | 97×100 (varies) |
| sylvan | 73 | idle(15), strike(14), dmg(13), death(13), fwd(18) | 266×376 (varies) |
| werewolf | 51 | idle(12), strike(13), dmg(6), death(6), fwd(14) | 67×88 (varies) |
| bear | 62 | idle(11), strike(20), dmg(6), death(12), fwd(13) | 273×185 (varies) |
| shriek | 72 | idle(20), strike(16), dmg(12), death(11), fwd(13) | 66×136 (varies) |
| compVan | 95 | idle(12), strike(13), special(20), dmg(10), death(12), fwd(12), evade(9), block(7) | 130×154 (varies) |
| compSha | 91 | idle(13), strike(13), special(18), dmg(10), death(12), fwd(12), evade(9), block(4) | 200×38 (varies) |
| compCas | 102 | idle(12), strike(17), special(22), dmg(10), death(12), fwd(11), evade(10), block(8) | 81×143 (varies) |
| compRng | 104 | idle(12), strike(16), special(21), dmg(11), death(12), fwd(12), evade(11), block(9) | 78×115 (varies) |
| heroWarStd | 95 | idle(12), strike(13), special(20), dmg(10), death(12), fwd(12), evade(9), block(7) | 103×121 (varies) |
| heroRogStd | 91 | idle(13), strike(13), special(18), dmg(10), death(12), fwd(12), evade(9), block(4) | 185×43 (varies) |
| heroMagStd | 102 | idle(12), strike(17), special(22), dmg(10), death(12), fwd(11), evade(10), block(8) | 204×31 (varies) |
| heroArcStd | 104 | idle(12), strike(16), special(21), dmg(11), death(12), fwd(12), evade(11), block(9) | 78×114 (varies) |

### `DATA.eaFx`

| Key | Size | Format | Alpha |
|---|---|---|---|
| fireballFly (6 frames) | 151×15 | WEBP | yes |
| fireballHit (18 frames) | 3×2 | WEBP | yes |
| bolt (6 frames) | 136×11 | WEBP | yes |
| boltHit (3 frames) | 419×443 | WEBP | yes |
| lightning (10 frames) | 341×25 | WEBP | yes |
| lightningHit (10 frames) | 283×642 | WEBP | yes |
| heal (16 frames) | 61×89 | WEBP | yes |
| buff (13 frames) | 65×30 | WEBP | yes |
| debuff (13 frames) | 65×30 | WEBP | yes |
| powerFlash (9 frames) | 146×157 | WEBP | yes |
| levelUp (13 frames) | 164×56 | WEBP | yes |
| arrow (1 frames) | 35×5 | WEBP | yes |
| frostFly (6 frames) | 168×19 | WEBP | yes |
| frostHit (24 frames) | 149×109 | WEBP | yes |
| bGetReady (12 frames) | 904×98 | WEBP | yes |
| bFight (12 frames) | 904×220 | WEBP | yes |
| bFinalWave (12 frames) | 904×98 | WEBP | yes |
| bVictory (14 frames) | 527×568 | WEBP | yes |
| bDefeated (12 frames) | 905×220 | WEBP | yes |
| bLevelUp (14 frames) | 721×600 | WEBP | yes |

### `DATA.eaBg`

| Key | Size | Format | Alpha |
|---|---|---|---|
| City/bg/d | 837×699 | WEBP | yes |
| City/fg/d | 904×700 | WEBP | yes |
| City/mid/d | 886×719 | WEBP | yes |
| Coast/fg/d | 897×658 | WEBP | yes |
| Coast/bg/d | 877×607 | WEBP | yes |
| Coast/mid/d | 927×679 | WEBP | yes |
| Forest/bg/d | 1041×715 | WEBP | yes |
| Forest/mid/d | 902×1040 | WEBP | yes |
| Forest/fg/d | 985×699 | WEBP | yes |
| ForestRoad/bg/d | 1041×715 | WEBP | yes |
| ForestRoad/mid/d | 999×1040 | WEBP | yes |
| ForestRoad/fg/d | 985×699 | WEBP | yes |
| Grassland/bg/d | 1002×628 | WEBP | yes |
| Grassland/fg/d | 897×641 | WEBP | yes |
| Grassland/mid/d | 1186×756 | WEBP | yes |
| GrasslandRoad/mid/d | 1223×756 | WEBP | yes |
| GrasslandRoad/fg/d | 897×641 | WEBP | yes |
| GrasslandRoad/bg/d | 1002×628 | WEBP | yes |
| Kaiten1/bg/d | 801×600 | WEBP | yes |
| Kaiten1/fg/d | 801×631 | WEBP | yes |
| Kaiten1/mid/d | 801×631 | WEBP | yes |
| Kaiten2/bg/d | 801×600 | WEBP | yes |
| Kaiten2/fg/d | 801×631 | WEBP | yes |
| Kaiten2/mid/d | 947×639 | WEBP | yes |
| Kaiten3/bg/d | 801×600 | WEBP | yes |
| Kaiten3/fg/d | 801×631 | WEBP | yes |
| Kaiten3/mid/d | 805×667 | WEBP | yes |
| Mountain/bg/d | 954×611 | WEBP | yes |
| Mountain/mid/d | 1144×726 | WEBP | yes |
| Mountain/fg/d | 874×648 | WEBP | yes |
| Plains/bg/d | 1002×628 | WEBP | yes |
| Plains/mid/d | 916×659 | WEBP | yes |
| Plains/fg/d | 801×662 | WEBP | yes |
| RockyCliffs/bg/d | 954×611 | WEBP | yes |
| RockyCliffs/mid/d | 1088×677 | WEBP | yes |
| RockyCliffs/fg/d | 874×648 | WEBP | yes |
| RuinCaves/bg/d | 1295×201 | WEBP | yes |
| RuinCaves/fg/d | 878×672 | WEBP | yes |
| RuinCaves/mid/d | 830×639 | WEBP | yes |
| Snowy/mid/d | 927×768 | WEBP | yes |
| Snowy/fg/d | 897×644 | WEBP | yes |
| Snowy/bg/d | 1002×628 | WEBP | yes |
| Swamp/bg/d | 914×616 | WEBP | yes |
| Swamp/fg/d | 801×684 | WEBP | yes |
| Swamp/mid/d | 938×902 | WEBP | yes |
| Wasteland/mid/d | 859×644 | WEBP | yes |
| Wasteland/bg/d | 836×619 | WEBP | yes |
| Wasteland/fg/d | 804×640 | WEBP | yes |
| larvaCaves/bg/d | 1237×201 | WEBP | yes |
| larvaCaves/mid/d | 847×630 | WEBP | yes |
| larvaCaves/fg/d | 867×653 | WEBP | yes |
| murkycaves/bg/d | 1237×201 | WEBP | yes |
| murkycaves/mid/d | 841×630 | WEBP | yes |
| murkycaves/fg/d | 882×648 | WEBP | yes |

### `DATA.eaMap`

| Key | Size | Format | Alpha |
|---|---|---|---|
| PP/0/d | 1300×800 | WEBP | no |
| PP/1/d | 1500×1100 | WEBP | no |
| PP/2/d | 1300×1200 | WEBP | no |
| PP/3/d | 1200×1200 | WEBP | no |
| PP/4/d | 1600×1300 | WEBP | no |
| PF/0/d | 2700×1400 | WEBP | no |
| PF/1/d | 2000×1200 | WEBP | no |
| PF/2/d | 1600×2700 | WEBP | no |
| PF/3/d | 2300×1300 | WEBP | no |
| PF/4/d | 1700×1200 | WEBP | no |
| PF/5/d | 1400×2400 | WEBP | no |
| PF/6/d | 1400×2000 | WEBP | no |
| GD/0/d | 1800×1200 | WEBP | no |
| GD/1/d | 1600×1400 | WEBP | no |
| GD/2/d | 2000×1200 | WEBP | no |
| GD/3/d | 1600×1600 | WEBP | no |
| GD/4/d | 1600×2200 | WEBP | no |
| GD/5/d | 2600×1400 | WEBP | no |
| WS/0/d | 2500×1400 | WEBP | no |
| WS/1/d | 1600×1200 | WEBP | no |
| WS/2/d | 1200×1600 | WEBP | no |
| WS/3/d | 2700×1000 | WEBP | no |
| WS/4/d | 2100×2100 | WEBP | no |
| WS/5/d | 2700×1800 | WEBP | no |
| WS/6/d | 2300×2250 | WEBP | no |
| OR/0/d | 2100×2100 | WEBP | no |
| OR/1/d | 2700×2000 | WEBP | no |
| OR/2/d | 2000×2500 | WEBP | no |
| OR/3/d | 2500×1750 | WEBP | no |
| OR/4/d | 2700×2100 | WEBP | no |
| OR/5/d | 2700×2100 | WEBP | no |
| OR/6/d | 2100×2700 | WEBP | no |
| WC/0/d | 2200×1400 | WEBP | no |
| WC/1/d | 2600×1600 | WEBP | no |
| WC/2/d | 2500×2000 | WEBP | no |
| WC/3/d | 1400×1000 | WEBP | no |
| WC/4/d | 1400×1000 | WEBP | no |
| KW/0/d | 2700×2000 | WEBP | no |
| KW/1/d | 2300×2250 | WEBP | no |
| KW/2/d | 2700×2000 | WEBP | no |
| KW/3/d | 1500×2500 | WEBP | no |
| KW/4/d | 2700×2000 | WEBP | no |
| KW/5/d | 1300×2600 | WEBP | no |
| KW/6/d | 2400×2200 | WEBP | no |

### `DATA.sprites`

| Key | Size | Format | Alpha |
|---|---|---|---|
| warrior/0 | 257×300 | PNG | yes |
| warrior/1 | 387×294 | PNG | yes |
| wizard/0 | 202×300 | PNG | yes |
| wizard/1 | 380×300 | PNG | yes |
| rogue/0 | 287×295 | PNG | yes |
| rogue/1 | 478×267 | PNG | yes |
| ranger/0 | 325×289 | PNG | yes |
| ranger/1 | 349×230 | PNG | yes |
| skeleton/0 | 126×249 | PNG | yes |
| ogre/0 | 148×148 | PNG | yes |
| zombie/0 | 220×280 | PNG | yes |
| banshee/0 | 191×182 | PNG | yes |
| spider/0 | 509×242 | PNG | yes |
| minotaur/0 | 244×320 | PNG | yes |
| ghost/0 | 521×225 | PNG | yes |
| slime/0 | 523×146 | PNG | yes |
| golem/0 | 456×320 | PNG | yes |
| wisp/0 | 256×174 | PNG | yes |
| arch/0 | 231×340 | PNG | yes |
| arch/1 | 242×340 | PNG | yes |
| arch/2 | 229×340 | PNG | yes |
| bastion/0 | 263×380 | PNG | yes |
| bastion/1 | 263×380 | PNG | yes |
| bastion/2 | 264×380 | PNG | yes |
| chest/0 | 254×200 | PNG | yes |
| chest/1 | 231×200 | PNG | yes |
| dragon/0 | 243×173 | PNG | yes |
| goblin/0 | 91×209 | PNG | yes |
| goblin/1 | 146×222 | PNG | yes |

### `DATA.terrain`

| Key | Size | Format | Alpha |
|---|---|---|---|
| crystal | 512×512 | JPEG | no |
| sky | 512×512 | JPEG | no |
| road | 512×512 | JPEG | no |
| aqua | 512×512 | JPEG | no |
| lava | 512×512 | JPEG | no |
| meadow | 512×512 | JPEG | no |
| forest | 512×512 | JPEG | no |
| desert | 512×512 | JPEG | no |
| volcano | 512×512 | JPEG | no |
| ruins | 512×512 | JPEG | no |

### `DATA.eaRooms`

| Key | Size | Format | Alpha |
|---|---|---|---|
| heroRoom/d | 420×427 | WEBP | yes |
| training/d | 420×150 | WEBP | yes |
| treasury/d | 420×228 | WEBP | yes |
| tavern/d | 420×216 | WEBP | yes |
| library/d | 420×410 | WEBP | yes |
| infirmary/d | 420×416 | WEBP | yes |
| greatHall/d | 420×286 | WEBP | yes |
| throne/d | 420×145 | WEBP | yes |
| alchemy/d | 420×220 | WEBP | yes |
| market/d | 420×147 | WEBP | yes |

### `DATA.props`

| Key | Size | Format | Alpha |
|---|---|---|---|
| mountain | 528×360 | WEBP | yes |
| outcrop | 335×360 | WEBP | yes |
| grove | 394×360 | WEBP | yes |
| vent | 690×360 | WEBP | yes |
| tower | 317×360 | WEBP | yes |
| stones | 513×360 | WEBP | yes |
| mesa | 621×360 | WEBP | yes |
| monolith | 294×360 | WEBP | yes |

### `DATA.eaComp`

| Key | Size | Format | Alpha |
|---|---|---|---|
| 0/port | 50×50 | WEBP | no |
| 1/port | 80×80 | WEBP | no |
| 2/port | 50×50 | WEBP | no |
| 3/port | 50×50 | WEBP | no |
| 4/port | 80×80 | WEBP | no |
| 5/port | 80×80 | WEBP | no |
| 6/port | 50×50 | WEBP | no |
| 7/port | 50×50 | WEBP | no |
| 8/port | 50×50 | WEBP | no |
| 9/port | 50×50 | WEBP | no |
| 10/port | 50×50 | WEBP | no |
| 11/port | 50×50 | WEBP | no |
| 12/port | 50×50 | WEBP | no |
| 13/port | 50×50 | WEBP | no |
| 14/port | 50×50 | WEBP | no |
| 15/port | 50×50 | WEBP | no |
| 16/port | 50×50 | WEBP | no |
| 17/port | 50×50 | WEBP | no |
| 18/port | 50×50 | WEBP | no |
| 19/port | 50×50 | WEBP | yes |

### `DATA.eaPartIcon`

| Key | Size | Format | Alpha |
|---|---|---|---|
| resistanceMelee/d | 87×86 | WEBP | yes |
| resistanceRanged/d | 87×91 | WEBP | yes |
| resistanceMagic/d | 87×87 | WEBP | yes |
| resistanceFire/d | 85×86 | WEBP | yes |
| resistanceCold/d | 88×89 | WEBP | yes |
| resistanceNature/d | 76×89 | WEBP | yes |
| resistanceShock/d | 89×85 | WEBP | yes |

### `DATA.eaVillainPort`

| Key | Size | Format | Alpha |
|---|---|---|---|
| raspin | 140×136 | WEBP | yes |
| soleil | 140×188 | WEBP | yes |
| deymour | 140×82 | WEBP | yes |
| beirus | 140×192 | WEBP | yes |
| dragon | 140×119 | WEBP | yes |

### `DATA.eaWorldMap`

| Key | Size | Format | Alpha |
|---|---|---|---|
| bg/d | 767×615 | WEBP | no |
| node/d | 133×169 | WEBP | yes |
| castle/d | 161×111 | WEBP | yes |

### `DATA.heroImg`

| Key | Size | Format | Alpha |
|---|---|---|---|
| (value) | 324×340 | PNG | yes |

