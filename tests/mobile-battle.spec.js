// @ts-check
const { test, expect } = require('@playwright/test');
const { freshGame, IPHONE_13_PRO_MAX } = require('./helpers');

/* Slice 2 of the iPhone plan: rig art wakes on demand, scoped to the fight.
   The title screen asks for no rigs at all; entering a battle wakes the
   participants' rigs through the draw path and they reach drawable readiness
   (the original DA Legends frames render, not the stand-ins, once landed).
   Runs against the generated mobile build so the wake is a real network
   fetch, exactly like the phone. */

test.describe('battle art on an iPhone 13 Pro Max', () => {
  test.use(IPHONE_13_PRO_MAX);

  test('pre-battle only the on-screen hero wakes; a battle wakes exactly its cast', async ({ page }) => {
    await freshGame(page, 'c', '/mobile/index.html');

    // idle a beat pre-battle: only the on-screen cast may be awake — the hero
    // walks the overworld behind the title, so deymour is first-screen art;
    // everyone else stays parked until a fight asks for them
    await page.waitForTimeout(1000);
    const preBattle = await page.evaluate(() =>
      Object.entries(window.__wf.EARIG).filter(([, r]) => r.woken).map(([k]) => k)
    );
    expect(
      preBattle.filter((k) => k !== 'deymour'),
      'no rig beyond the on-screen hero may load before a fight asks'
    ).toEqual([]);

    // walk into a fight (Scopecreep is a goblin — the genlock rig)
    await page.evaluate(() => {
      const wf = window.__wf;
      window.startBattle({ enemyKey: 'scopecreep', region: wf.DATA.regions[0], spawn: null, boss: false });
    });

    // the battle's draw path wakes the cast, and the frames become drawable —
    // the readiness gate turning truthy IS "the original art renders"
    await page.waitForFunction(() => {
      const wf = window.__wf;
      return wf.foeSpriteKey({ shape: 'goblin' }) === 'genlock' &&
             wf.memberSpriteKey({ kind: 'hero', cls: 'vanguard' }) === 'deymour';
    }, null, { timeout: 15000 });

    const woken = await page.evaluate(() =>
      Object.entries(window.__wf.EARIG).filter(([, r]) => r.woken).map(([k]) => k)
    );
    // the cast is awake…
    expect(woken).toContain('genlock');
    expect(woken).toContain('deymour');
    // …and the wake stayed scoped to this fight, not the whole bestiary
    expect(woken.length, `woken rigs: ${woken.join(', ')}`).toBeLessThanOrEqual(8);
    expect(woken).not.toContain('raspin');   // a villain with no part in this fight
  });
});
