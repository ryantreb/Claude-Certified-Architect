// @ts-check
/* The original effects: vfx.swf anims, vfx_ui banners, and the damage bursts
   running the original ParticleSys numbers. Presentation only — reduced
   motion silences everything and SM-2 state never moves. */
const { test } = require('@playwright/test');
const { freshGame, expect } = require('./helpers');

test('the effect library is aboard: spells, impacts, banners, burst icons', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    const fx = wf.DATA.eaFx, icons = wf.DATA.eaPartIcon;
    return {
      keys: Object.keys(fx).sort(),
      framed: Object.values(fx).every(e => e.f.length > 0 && e.fps > 0),
      icons: Object.keys(icons).sort(),
    };
  });
  expect(out.keys).toEqual(['arrow', 'bDefeated', 'bFight', 'bFinalWave', 'bGetReady', 'bLevelUp',
    'bVictory', 'bolt', 'boltHit', 'buff', 'debuff', 'fireballFly', 'fireballHit', 'frostFly',
    'frostHit', 'heal', 'levelUp', 'lightning', 'lightningHit', 'powerFlash']);
  expect(out.framed).toBe(true);
  expect(out.icons).toEqual(['resistanceCold', 'resistanceFire', 'resistanceMagic', 'resistanceMelee',
    'resistanceNature', 'resistanceRanged', 'resistanceShock']);
});

test('bursts run the original numbers and respect reduced motion', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    window.startBattle({ enemyKey: 'scopecreep', region: wf.DATA.regions[0], spawn: null, boss: false });
    const srBefore = JSON.stringify(wf.S.sr);
    const phys = wf.EAPART_PHYS, pools = wf.EAPART;
    wf.FXQ.parts.length = 0;
    const okOn = wf.burstFx('melee', 100, 100);
    const queued = wf.FXQ.parts.length;
    const poolSize = wf.FXQ.parts[0] ? wf.FXQ.parts[0].ps.length : 0;
    wf.S.settings.motion = false;
    const okOff = wf.burstFx('melee', 100, 100);
    const stillQueued = wf.FXQ.parts.length;
    wf.S.settings.motion = true;
    return { phys, magicPool: pools.magic.pool, meleePool: pools.melee.pool,
      okOn, queued, poolSize, okOff, stillQueued,
      srSame: JSON.stringify(wf.S.sr) === srBefore };
  });
  // EFFECTS_PARTICLEEFFECTS.xml, verbatim
  expect(out.phys).toEqual({ life: 0.5, sizeStart: 5, sizeEnd: 0, vel: 4, velRand: 40,
    grav: 30, gravAngle: 270, force: 50, fps: 24 });
  expect(out.meleePool).toBe(25);
  expect(out.magicPool).toBe(18);
  expect(out.okOn).toBe(true);
  expect(out.queued).toBe(1);
  expect(out.poolSize).toBe(25);
  expect(out.okOff).toBe(false);
  expect(out.stillQueued).toBe(1);
  expect(out.srSame).toBe(true);
});

test('battles open under the original banners; bosses call the final wave', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    window.startBattle({ enemyKey: 'scopecreep', region: wf.DATA.regions[0], spawn: null, boss: false });
    const normal = wf.FXQ.anims.map(a => a.key);
    const region = wf.DATA.regions.find(r => r.cert === 'c' && r.boss);
    window.startBattle({ enemyKey: region.boss, region, spawn: null, boss: true });
    const boss = wf.FXQ.anims.map(a => a.key);
    return { normal, boss };
  });
  expect(out.normal).toEqual(['bGetReady', 'bFight']);
  expect(out.boss).toEqual(['bFinalWave', 'bFight']);
});
