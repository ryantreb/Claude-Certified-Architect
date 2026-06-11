// @ts-check
/* Commit 8 — EA creature sprite animation.
   Foe shapes map to rasterized DA Legends animation sheets (greyscale+alpha,
   hue-tinted at draw); unmapped shapes fall back to the code-drawn monster.
   These tests cover the mapping and the frame-index math, not the canvas pixels. */
const { test } = require('@playwright/test');
const { loadGame, expect } = require('./helpers');

test('mapped foe shapes resolve to a loaded EA sprite sheet', async ({ page }) => {
  await loadGame(page);
  // wait for the genlock sheet image to finish decoding
  await page.waitForFunction(() => window.__wf.EASPR.genlock && window.__wf.EASPR.genlock.ready, null, { timeout: 5000 });
  const out = await page.evaluate(() => ({
    mapped: window.__wf.foeSpriteKey({ shape: 'goblin' }),
    unmapped: window.__wf.foeSpriteKey({ shape: 'totally-made-up' }),
    hasStates: Object.keys(window.__wf.DATA.eaSprites.genlock.states).sort(),
  }));
  expect(out.mapped).toBe('genlock');
  expect(out.unmapped).toBe(null);                 // falls back to drawMonster
  expect(out.hasStates).toEqual(['attack', 'death', 'idle']);
});

test('idle loops and one-shot states clamp on the last frame', async ({ page }) => {
  await loadGame(page);
  const out = await page.evaluate(() => {
    const wf = window.__wf, rec = wf.DATA.eaSprites.genlock;
    const idleN = rec.states.idle.frames, fps = rec.fps;
    // idle wraps around
    const i0 = wf.spriteFrameIndex(rec, 'idle', { t: 0 });
    const iWrap = wf.spriteFrameIndex(rec, 'idle', { t: idleN / fps }); // one full loop -> back to 0
    // one-shot death clamps at the final frame when prog >= 1
    const dEnd = wf.spriteFrameIndex(rec, 'death', { prog: 1 });
    const dOver = wf.spriteFrameIndex(rec, 'death', { prog: 5 });
    return { i0, iWrap, idleN, deathN: rec.states.death.frames, dEnd, dOver };
  });
  expect(out.i0).toBe(0);
  expect(out.iWrap).toBe(0);                       // looped back to the start
  expect(out.dEnd).toBe(out.deathN - 1);           // holds the last death frame
  expect(out.dOver).toBe(out.deathN - 1);          // never overruns
});

test('party classes map to EA hero rigs and the hero carries the greatsword', async ({ page }) => {
  await loadGame(page);
  await page.waitForFunction(() => ['hero1H','hero2H','heroDUAL','heroBOW','heroSTAFF']
    .every(k => window.__wf.EASPR[k] && window.__wf.EASPR[k].ready), null, { timeout: 6000 });
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    return {
      hero: wf.memberSpriteKey({ kind: 'hero', cls: 'vanguard' }),
      vanguard: wf.memberSpriteKey({ kind: 'comp', cls: 'vanguard' }),
      shadow: wf.memberSpriteKey({ kind: 'comp', cls: 'shadow' }),
      caster: wf.memberSpriteKey({ kind: 'comp', cls: 'caster' }),
      ranger: wf.memberSpriteKey({ kind: 'comp', cls: 'ranger' }),
      brightLightens: wf.tintBright('#000000') !== '#000000',
    };
  });
  expect(out.hero).toBe('hero2H');
  expect(out.vanguard).toBe('hero1H');
  expect(out.shadow).toBe('heroDUAL');
  expect(out.caster).toBe('heroSTAFF');
  expect(out.ranger).toBe('heroBOW');
  expect(out.brightLightens).toBe(true);
});
