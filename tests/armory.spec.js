// @ts-check
/* The Armory: original EQUIPMENT_WEAPON loot plugged into the d20.
   Weapons come from tactical play and feed back ONLY into tactical numbers
   (+to-hit by tier, +crit range from agility) — never into mastery/meters. */
const { test } = require('@playwright/test');
const { freshGame, expect } = require('./helpers');

test('a wielded weapon sharpens the d20: +tier to hit, agility widens crits', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    wf.armState();
    const m = { cls: 'vanguard' };
    const bare = { hit: wf.atkBonusOf(m), crit: wf.critRangeOf(m, null) };
    // wield a tier-3 blade with agility (Soulless Greatblade class of arm)
    const i = wf.DATA.eaWeapons.vanguard.findIndex(w => w.t === 3 && w.agi > 0);
    wf.S.armory.vanguard.push(i);
    wf.S.wield.vanguard = i;
    const armed = { hit: wf.atkBonusOf(m), crit: wf.critRangeOf(m, null) };
    return { bare, armed, tier: wf.DATA.eaWeapons.vanguard[i].t };
  });
  expect(out.armed.hit - out.bare.hit).toBe(out.tier);   // +3 from a tier-3 arm
  expect(out.bare.crit - out.armed.crit).toBe(1);        // crit range widened by 1
});

test('weapon drops are tactical only: armory fills, meters never move', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    window.startBattle({ enemyKey: 'scopecreep', region: wf.DATA.regions[0], spawn: null, boss: false });
    const meterBefore = wf.meterOf('c').total;
    const srBefore = JSON.stringify(wf.S.sr);
    const drop = wf.rollWeaponDrop(true);                // boss flag -> guaranteed
    return {
      drop,
      owned: drop ? wf.S.armory[drop.cls].includes(drop.i) : false,
      wielded: drop ? wf.S.wield[drop.cls] === drop.i : false,
      meterDelta: wf.meterOf('c').total - meterBefore,
      srUntouched: JSON.stringify(wf.S.sr) === srBefore,
    };
  });
  expect(out.drop).not.toBeNull();
  expect(out.owned).toBe(true);
  expect(out.wielded).toBe(true);                        // first find is wielded on the spot
  expect(out.meterDelta).toBe(0);
  expect(out.srUntouched).toBe(true);
});

test('the weapon table carries the original names and a full tier spread per class', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf, W = wf.DATA.eaWeapons;
    const classes = Object.keys(W).sort();
    const tiersOk = classes.every(c => [1, 2, 3].every(t => W[c].some(w => w.t === t)));
    return { classes, tiersOk, sample: W.vanguard.find(w => w.t === 3).n };
  });
  expect(out.classes).toEqual(['caster', 'ranger', 'shadow', 'vanguard']);
  expect(out.tiersOk).toBe(true);
  expect(out.sample.length).toBeGreaterThan(3);          // a real original item name
});
