// @ts-check
/* EA creature animation — verbatim DA Legends rigs.
   Foe shapes map to per-frame rasters exported from the original SWFs (original
   palettes, no tinting); the party are the game's own companions. These tests
   cover the mapping, the frame metadata, and action_frame timing — not pixels. */
const { test } = require('@playwright/test');
const { loadGame, expect } = require('./helpers');

test('mapped foe shapes resolve to a loaded verbatim rig', async ({ page }) => {
  await loadGame(page);
  // wait for the genlock idle frame 0 to finish decoding
  await page.waitForFunction(() => {
    const r = window.__wf.EARIG.genlock;
    return r && r.anims.idle && r.anims.idle[0].complete && r.anims.idle[0].naturalWidth > 0;
  }, null, { timeout: 8000 });
  const out = await page.evaluate(() => ({
    mapped: window.__wf.foeSpriteKey({ shape: 'goblin' }),
    unmapped: window.__wf.foeSpriteKey({ shape: 'totally-made-up' }),
    anims: Object.keys(window.__wf.DATA.eaRig.genlock.anims).sort(),
  }));
  expect(out.mapped).toBe('genlock');
  expect(out.unmapped).toBe(null);                 // falls back to drawMonster
  expect(out.anims).toEqual(['death', 'dmg', 'idle', 'strike']);
});

test('every rig keeps original frame geometry and an action_frame on its strike', async ({ page }) => {
  await loadGame(page);
  const out = await page.evaluate(() => {
    const rig = window.__wf.DATA.eaRig, bad = [];
    for (const k of Object.keys(rig)) {
      const e = rig[k];
      for (const a of ['idle', 'strike', 'dmg', 'death']) {
        const an = e.anims[a];
        if (!an) { bad.push(k + ' missing ' + a); continue; }
        if (!(an.f.length > 1)) bad.push(k + '.' + a + ' too few frames');
        if (!(an.fps > 0)) bad.push(k + '.' + a + ' no fps');
        if (!(typeof an.ox === 'number' && typeof an.oy === 'number')) bad.push(k + '.' + a + ' no origin');
      }
      const st = e.anims.strike;
      if (st && (st.af == null || st.af < 0 || st.af >= st.f.length))
        bad.push(k + ' strike has no usable action_frame');
    }
    return { bad, count: Object.keys(rig).length };
  });
  expect(out.bad).toEqual([]);
  expect(out.count).toBeGreaterThanOrEqual(18);    // 13 foes + the companion party
});

test('hits land on the strike action_frame, never at time zero', async ({ page }) => {
  await loadGame(page);
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    return {
      hero: wf.rigActionDelay('deymour'),
      goblin: wf.rigActionDelay('genlock'),
      strikeDur: wf.rigDur('genlock', 'strike'),
    };
  });
  expect(out.hero).toBeGreaterThan(0);
  expect(out.goblin).toBeGreaterThan(0);
  expect(out.goblin).toBeLessThan(out.strikeDur);  // the blow lands mid-swing
});

test('the party are the DA Legends companions with portraits', async ({ page }) => {
  await loadGame(page);
  await page.waitForFunction(() => ['deymour', 'shale', 'tianne', 'soleil', 'beirus']
    .every(k => {
      const r = window.__wf.EARIG[k];
      return r && r.anims.idle && r.anims.idle[0].complete && r.anims.idle[0].naturalWidth > 0;
    }), null, { timeout: 8000 });
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    return {
      hero: wf.memberSpriteKey({ kind: 'hero', cls: 'vanguard' }),
      vanguard: wf.memberSpriteKey({ kind: 'comp', cls: 'vanguard' }),
      shadow: wf.memberSpriteKey({ kind: 'comp', cls: 'shadow' }),
      caster: wf.memberSpriteKey({ kind: 'comp', cls: 'caster' }),
      ranger: wf.memberSpriteKey({ kind: 'comp', cls: 'ranger' }),
      portraits: ['deymour', 'shale', 'tianne', 'soleil', 'beirus']
        .every(k => wf.EARIG[k].portrait && wf.EARIG[k].portrait.src.length > 50),
    };
  });
  expect(out.hero).toBe('deymour');
  expect(out.vanguard).toBe('shale');
  expect(out.shadow).toBe('tianne');
  expect(out.caster).toBe('soleil');
  expect(out.ranger).toBe('beirus');
  expect(out.portraits).toBe(true);
});

test('battle slots sit on the original BattleDisplay grid', async ({ page }) => {
  await loadGame(page);
  const out = await page.evaluate(() => {
    const sp = window.__wf.slotPos;
    return {
      pFront: sp('p', 0, 0), pBack: sp('p', 1, 0),
      fFront: sp('f', 0, 0), fBack: sp('f', 1, 0),
      row1: sp('p', 0, 1), row2: sp('p', 0, 2),
    };
  });
  // the exact constants recovered from BattleDisplay.as
  expect(out.pFront).toEqual({ x: 300, y: 190 });
  expect(out.pBack).toEqual({ x: 150, y: 190 });
  expect(out.fFront).toEqual({ x: 510, y: 190 });
  expect(out.fBack).toEqual({ x: 660, y: 190 });
  expect(out.row1.y).toBe(340);
  expect(out.row2.y).toBe(490);
});
