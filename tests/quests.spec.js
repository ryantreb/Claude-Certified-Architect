// @ts-check
/* The original campaign and castle: quest lines ride as flavor over study
   objectives; room art dresses the keep. Progress comes from mastery alone. */
const { test } = require('@playwright/test');
const { freshGame, expect } = require('./helpers');

test('the original quest lines and castle rooms are aboard', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    return {
      chains: Object.fromEntries(Object.entries(wf.DATA.eaQuests).map(([k, v]) => [k, v.length])),
      firstPP: wf.DATA.eaQuests.PP[0],
      rooms: Object.keys(wf.DATA.eaRooms).sort(),
      roomArt: Object.values(wf.DATA.eaRooms).every(r => r.d.startsWith('data:image/webp')),
    };
  });
  expect(out.chains.PP).toBeGreaterThanOrEqual(7);
  expect(out.chains.PF).toBeGreaterThanOrEqual(10);
  expect(out.chains.OR).toBeGreaterThanOrEqual(8);
  expect(out.firstPP.n).toBe('Prove Yourself');
  expect(out.rooms).toEqual(['alchemy', 'greatHall', 'heroRoom', 'infirmary', 'library',
    'market', 'tavern', 'throne', 'training', 'treasury']);
  expect(out.roomArt).toBe(true);
});

test('the campaign turns its pages on wins and never drives progression', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    const r0 = wf.trackRegions('c')[0];
    const chain = wf.questChainOf(r0);
    const atStart = wf.regionQuestNow(r0);
    wf.regState(r0.id).wins = 2;
    const afterWins = wf.regionQuestNow(r0);
    const srBefore = JSON.stringify(wf.S.sr);
    const obj = wf.currentQuest();
    return {
      bound: chain.length > 0, first: atStart && atStart.n, later: afterWins && afterWins.n,
      objCarries: obj.text.includes('「'),
      srSame: JSON.stringify(wf.S.sr) === srBefore,
    };
  });
  expect(out.bound).toBe(true);
  expect(out.first).toBe('Prove Yourself');
  expect(out.later).not.toBe(out.first);        // pages turned with the wins
  expect(out.objCarries).toBe(true);            // objective chip names the original quest
  expect(out.srSame).toBe(true);
});

test('the class skills wear their original SKILL_SKILLS names in the strike menu', async ({ page }) => {
  await freshGame(page, 'c');
  await page.evaluate(() => {
    const wf = window.__wf;
    wf.S.level = 10;                       // all three skills unlocked
    wf.S.hero = { rig: 'heroMag', cls: 'caster' };
    window.startBattle({ enemyKey: 'scopecreep', region: wf.DATA.regions[0], spawn: null, boss: false });
    window.pickAction(0);
    window.onAnswer(wf.B.opts.findIndex(o => o.ok));
  });
  const labels = await page.evaluate(() => [...document.querySelectorAll('#skillRow button')].map(b => b.textContent).join(' '));
  expect(labels).toContain('Bolt');        // the mage's original basic
  expect(labels).toContain('Frostbite');   // original "cripples target"
  expect(labels).toContain('Storm');       // original "hits all enemies"
});
