// @ts-check
/* Enemy stat tables from the original CHARACTER_CHARCLASS.xml.
   Foe vitality and hit strength follow the EA medians per shape (genlock = the
   hp-12 baseline); the exam gauntlet keeps its question-count pacing unscaled. */
const { test } = require('@playwright/test');
const { loadGame, expect } = require('./helpers');

async function spawn(page, enemyKey) {
  return page.evaluate((ek) => {
    const wf = window.__wf;
    window.startBattle({ enemyKey: ek, region: wf.DATA.regions[0], spawn: null, boss: false });
    const f = wf.B.foes[0];
    return { shape: f.e.shape, max: f.max, atkW: f.atkW };
  }, enemyKey);
}

test('foe vitality follows the original ledger: ogres outlast zombies', async ({ page }) => {
  await loadGame(page);
  const ogre = await spawn(page, 'bristleback');     // shape ogre: hp 24 -> x2 of the genlock baseline
  const zombie = await spawn(page, 'prompthusk');    // shape zombie: hp 10 -> below baseline
  const goblin = await spawn(page, 'scopecreep');    // shape goblin: hp 12 = the baseline
  expect(ogre.max).toBeGreaterThan(goblin.max);
  expect(zombie.max).toBeLessThanOrEqual(goblin.max);
  expect(ogre.max).toBeGreaterThan(zombie.max);
});

test('hit strength carries the original attack weight', async ({ page }) => {
  await loadGame(page);
  const ogre = await spawn(page, 'bristleback');     // atk 60 -> capped heavy hitter
  const zombie = await spawn(page, 'prompthusk');    // atk 18 -> soft hitter
  expect(ogre.atkW).toBeGreaterThan(1);
  expect(zombie.atkW).toBeLessThan(1);
  const table = await page.evaluate(() => window.__wf.DATA.eaStats);
  expect(table.ogre.hp).toBe(24);                    // straight from CHARCLASS medians
  expect(table.zombie.atk).toBe(18);
});
