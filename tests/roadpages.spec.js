// @ts-check
/* The road walks the original quest maps, page by page: QUESTBIND names the
   set, wins and the felled boss turn pages, Orzammar pages sing the deep
   roads. Rendering and music read progression state; they never write it. */
const { test } = require('@playwright/test');
const { freshGame, expect } = require('./helpers');

test('every page of the campaign-bound map sets is aboard with its trail', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf, M = wf.DATA.eaMap;
    return {
      counts: Object.fromEntries(Object.entries(M).map(([k, v]) => [k, v.length])),
      allTrails: Object.values(M).every(pages => pages.every(p => p.pts.length >= 2 && p.d.startsWith('data:image/webp'))),
      deepRoads: M.OR[4].set,
    };
  });
  expect(out.counts).toEqual({ PP: 5, PF: 7, GD: 6, WS: 7, OR: 7, WC: 5, KW: 7 });
  expect(out.allTrails).toBe(true);
  expect(out.deepRoads).toBe('L_OR_5');          // the Deep Roads page itself
});

test('wins and the boss turn the pages; the crossweave rides the Waking Coves', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    const regs = wf.trackRegions('c');
    const r0 = regs[0];
    const srBefore = JSON.stringify(wf.S.sr);
    const fresh = wf.regionRoadPage('c', r0.id);
    wf.regState(r0.id).wins = 3;
    const later = wf.regionRoadPage('c', r0.id);
    wf.regState(r0.id).boss = true;
    const cleared = wf.regionRoadPage('c', r0.id);
    const last = wf.regionRoadPage('c', regs[4].id);
    const cross = wf.regionRoadPage('c', 'x0r');
    return { fresh, later, cleared, last, cross,
      srSame: JSON.stringify(wf.S.sr) === srBefore };
  });
  expect(out.fresh).toEqual({ key: 'PP', page: 0 });
  expect(out.later.page).toBe(3);
  expect(out.cleared.page).toBe(4);              // boss -> the set's last page
  expect(out.last.key).toBe('OR');               // the fifth region walks Orzammar
  expect(out.cross.key).toBe('WC');              // the Crossweave rides the Coves
  expect(out.srSame).toBe(true);
});

test('the hero walks the current page and the deep roads sing under Orzammar', async ({ page }) => {
  await freshGame(page, 'c');
  const final = await page.evaluate(() => {
    const wf = window.__wf;
    wf.S.settings.music = false; wf.S.settings.sound = false;
    wf.layoutRoads();
    const hp = wf.heroMP();
    const loopHome = wf.worldLoop();
    return { hp: hp && { key: hp.key, page: hp.page }, loopHome };
  });
  expect(final.hp.key).toBe('PP');               // the hero starts on Planasene Pass
  expect(final.hp.page).toBe(0);
  expect(final.loopHome).toBe('quest');
});
