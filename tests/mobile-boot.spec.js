// @ts-check
const { test, expect } = require('@playwright/test');
const { IPHONE_13_PRO_MAX } = require('./helpers');

/* The phone boot budget. iOS Safari kills a tab that decodes too much art at
   once, and the DA Legends rigs alone are ~3,300 frames — far beyond what an
   iPhone can hold decoded. The engine must boot to the title screen having
   requested only the art the first screen actually needs (terrain, props,
   backgrounds, hero, UI), and leave every battle rig un-fetched until a fight
   asks to draw it. This spec locks that budget against the generated mobile/
   build under iPhone 13 Pro Max emulation. */

/* Boot may request at most this many images. The full asset set is ~3,800;
   the first screen legitimately needs well under 400 (terrain 10, props 8,
   backgrounds 54, hero, class sprites, keep/companion art). */
const BOOT_IMG_BUDGET = 400;

test.describe('mobile build on an iPhone 13 Pro Max', () => {
  test.use(IPHONE_13_PRO_MAX);

  test('boots to the title screen within the boot-time image budget', async ({ page }) => {
    // the default resource-timing buffer is 250 entries — raise it before any
    // page script runs so every asset request is counted, not just the first 250
    await page.addInitScript(() => {
      performance.setResourceTimingBufferSize(100000);
    });

    await page.goto('/mobile/index.html');

    // the game must actually boot on a phone-shaped viewport, to a real title
    // screen — not just a live bridge over a blank canvas
    await page.waitForFunction(() => !!window.__wf && !!window.__wf.S);
    expect(await page.evaluate(() => window.__wf.MODE)).toBe('title');

    // …then wait for the boot-time image flurry to go quiet (count stable for
    // a full second) so slow runs can't hide late eager loads from the budget
    const countImgs = () =>
      page.evaluate(() =>
        performance
          .getEntriesByType('resource')
          .filter(
            (e) =>
              /** @type {PerformanceResourceTiming} */ (e).initiatorType === 'img' &&
              e.name.includes('/mobile/assets/')
          ).length
      );
    let bootImgs = await countImgs();
    for (let quiet = 0; quiet < 2; ) {
      await page.waitForTimeout(500);
      const now = await countImgs();
      quiet = now === bootImgs ? quiet + 1 : 0;
      bootImgs = now;
    }

    expect(
      bootImgs,
      `boot requested ${bootImgs} images — an iPhone-safe boot must stay under ${BOOT_IMG_BUDGET}`
    ).toBeLessThanOrEqual(BOOT_IMG_BUDGET);
  });
});
