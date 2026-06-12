// @ts-check
/* Fight the original fights: named villains at the rifts, original node
   compositions on original ground, the original leveling ledger, famous
   companions as themselves, and the mage's Summon Spider. All tactical —
   SM-2 state and the meters never move. */
const { test } = require('@playwright/test');
const { freshGame, expect } = require('./helpers');

test('the campaign villains hold the rifts on both tracks', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    const names = (tr) => wf.trackRegions(tr).map(r => wf.DATA.enemies[r.boss].name);
    return {
      c: names('c'), g: names('g').slice(0, 5),
      shapes: wf.trackRegions('c').map(r => wf.DATA.enemies[r.boss].shape),
      stats: ['raspin', 'soleil', 'tianne', 'deymour', 'beirus'].every(s => wf.DATA.eaStats[s] && wf.DATA.eaStats[s].atk > 0),
      ports: Object.keys(wf.DATA.eaVillainPort).sort(),
    };
  });
  const five = ['Raspin', 'Soleil', 'Tianne', 'Deymour', 'Beirus'];
  expect(out.c).toEqual(five);
  expect(out.g).toEqual(five);
  expect(out.shapes).toEqual(['raspin', 'soleil', 'tianne', 'deymour', 'beirus']);
  expect(out.stats).toBe(true);
  expect(out.ports).toEqual(['beirus', 'deymour', 'dragon', 'raspin', 'soleil']);
});

test('road battles spawn the original node compositions on their original ground', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    const srBefore = JSON.stringify(wf.S.sr);
    const enc = wf.DATA.eaEnc.PP[0].find(x => x && x.foes && x.foes.length >= 2);
    window.startBattle({ enemyKey: 'scopecreep', region: wf.DATA.regions[0], spawn: null, boss: false,
      eaWave: enc.foes, eaBgTile: enc.bg });
    return {
      foeNames: wf.B.foes.map(f => f.e.name),
      origNames: enc.foes.map(f => f.n),
      shapes: wf.B.foes.map(f => f.e.shape),
      tile: wf.B.eaBgTile, encBg: enc.bg,
      rigged: wf.B.foes.every(f => !!wf.SHAPE_SPRITE[f.e.shape]),
      srSame: JSON.stringify(wf.S.sr) === srBefore,
    };
  });
  expect(out.foeNames).toEqual(out.origNames.slice(0, 6));   // original names, verbatim
  expect(out.tile).toBe(out.encBg);                          // original tileset rides into the fight
  expect(out.rigged).toBe(true);
  expect(out.srSame).toBe(true);
});

test('all 18 original backdrops are aboard and every walked tileset resolves', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    const tiles = new Set();
    for (const pages of Object.values(wf.DATA.eaEnc))
      for (const page2 of pages) for (const nd of page2) if (nd && nd.bg) tiles.add(nd.bg);
    const KEY = { grassland: 'Grassland', grasslandRoad: 'GrasslandRoad', forest: 'Forest',
      forestRoad: 'ForestRoad', mountain: 'Mountain', swamp: 'Swamp', wasteland: 'Wasteland',
      coast: 'Coast', snowy: 'Snowy', ruinCaves: 'RuinCaves', murkyCaves: 'murkycaves',
      larvaCaves: 'larvaCaves', city: 'City' };
    return {
      bgSets: Object.keys(wf.DATA.eaBg).length,
      unresolved: [...tiles].filter(t => !wf.DATA.eaBg[KEY[t]]),
    };
  });
  expect(out.bgSets).toBeGreaterThanOrEqual(18);
  expect(out.unresolved).toEqual([]);
});

test('the original leveling ledger pays what the foes were worth', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    window.startBattle({ enemyKey: 'scopecreep', region: wf.DATA.regions[0], spawn: null, boss: false });
    return { l1: wf.xpNeed(1), l2: wf.xpNeed(2), l12: wf.xpNeed(12), xp: wf.battleXp(false) };
  });
  expect(out.l1).toBe(100);          // CHARACTER_LEVELING XPDeltaNext, verbatim
  expect(out.l2).toBe(150);
  expect(out.l12).toBe(1250);
  expect(out.xp).toBeGreaterThan(0);
});

test('Summon Spider seats an ally that flanks; Tovez fights as a Carta dwarf', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    const srBefore = JSON.stringify(wf.S.sr);
    wf.S.level = 15;
    window.startBattle({ enemyKey: 'scopecreep', region: wf.DATA.regions[0], spawn: null, boss: false });
    const before = wf.atkBonusOf(wf.B.party[0]);
    wf.B.mana = 3;
    wf.castSummon({ n: 'Summon Spider', mana: 1, summon: 'spiders' });
    const spider = wf.B.party.find(m => m.kind === 'summon');
    const after = wf.atkBonusOf(wf.B.party[0]);
    const tovezKey = wf.memberSpriteKey({ kind: 'comp', id: 'NPC_TOVEZ', cls: 'vanguard' });
    return { seated: !!spider, hp: spider && spider.halves, flank: after - before,
      tovezKey, srSame: JSON.stringify(wf.S.sr) === srBefore };
  });
  expect(out.seated).toBe(true);
  expect(out.hp).toBe(4);
  expect(out.flank).toBe(1);
  expect(out.tovezKey).toBe('carta2H');
  expect(out.srSame).toBe(true);
});

test('the champion visibly re-dresses at Standard-grade armor', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    wf.S.hero = { rig: 'heroWar', cls: 'vanguard' };
    wf.vaultState();
    const bare = wf.heroRigKey();
    const ai = wf.DATA.eaItems.armor.findIndex(a => a[7] >= 2);
    wf.S.vault.armor.push(ai); wf.S.gear.armor = ai;
    const dressed = wf.heroRigKey();
    wf.S.gear.armor = null;
    const undressed = wf.heroRigKey();
    return { bare, dressed, undressed, hasStd: !!wf.DATA.eaRig.heroWarStd };
  });
  expect(out.hasStd).toBe(true);
  expect(out.bare).toBe('heroWar');
  expect(out.dressed).toBe('heroWarStd');
  expect(out.undressed).toBe('heroWar');
});
