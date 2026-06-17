// @ts-check
/* The original equipment catalog (EQUIPMENT_*.xml), stats only: pieces fall
   into the Vault, the champion wears one per slot, and worn stats derive
   capped tactical numbers. Mastery and meters never wear a ring. */
const { test } = require('@playwright/test');
const { freshGame, expect } = require('./helpers');

test('the catalog is aboard: six slots, original names and stats', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf, I = wf.DATA.eaItems;
    return {
      slots: Object.keys(I).sort(),
      counts: Object.fromEntries(Object.entries(I).map(([k, v]) => [k, v.length])),
      sample: I.ring.find(r => r[0] === 'Iron Ring of Power'),
    };
  });
  expect(out.slots).toEqual(['amulet', 'armor', 'belt', 'helmet', 'ring', 'shield']);
  expect(out.counts.armor).toBeGreaterThan(700);
  expect(out.counts.ring).toBeGreaterThan(200);
  expect(out.sample).toBeTruthy();
  expect(out.sample[2]).toBe(1);                  // +1 attack, verbatim
});

test('worn gear dresses the d20 with caps; drops fill the Vault, not the meters', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    wf.vaultState();
    const hero = { kind: 'hero', cls: 'vanguard' };
    const bare = { hit: wf.atkBonusOf(hero), guard: wf.guardBonusOf(hero), crit: wf.critRangeOf(hero, null) };
    // dress in heavy originals: high-def armor, +atk ring, +agi belt
    const ai = wf.DATA.eaItems.armor.findIndex(a => a[1] >= 24);
    const ri = wf.DATA.eaItems.ring.findIndex(r => r[2] >= 12);
    const bi = wf.DATA.eaItems.belt.findIndex(b => b[3] >= 12);
    wf.S.vault.armor.push(ai); wf.S.gear.armor = ai;
    wf.S.vault.ring.push(ri); wf.S.gear.ring = ri;
    wf.S.vault.belt.push(bi); wf.S.gear.belt = bi;
    const dressed = { hit: wf.atkBonusOf(hero), guard: wf.guardBonusOf(hero), crit: wf.critRangeOf(hero, null) };
    const compUnchanged = wf.atkBonusOf({ kind: 'comp', id: 'comp_c0', cls: 'vanguard' });
    // a drop fills the vault and never the meters
    window.startBattle({ enemyKey: 'scopecreep', region: wf.DATA.regions[0], spawn: null, boss: false });
    const meterBefore = wf.meterOf('c').total;
    const srBefore = JSON.stringify(wf.S.sr);
    const drop = wf.rollItemDrop(true);
    return { bare, dressed, compUnchanged, drop,
      owned: drop ? wf.S.vault[drop.slot].includes(drop.i) : false,
      meterDelta: wf.meterOf('c').total - meterBefore,
      srSame: JSON.stringify(wf.S.sr) === srBefore };
  });
  expect(out.dressed.guard - out.bare.guard).toBe(3);   // def cap +3
  expect(out.dressed.hit - out.bare.hit).toBe(2);       // atk cap +2
  expect(out.bare.crit - out.dressed.crit).toBe(1);     // agi widens crit
  expect(out.compUnchanged).toBe(4);                    // gear dresses the champion only
  expect(out.drop).not.toBeNull();
  expect(out.owned).toBe(true);
  expect(out.meterDelta).toBe(0);
  expect(out.srSame).toBe(true);
});
