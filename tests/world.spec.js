// @ts-check
/* Paint the whole world: renderWorld owns its DPR transform (a fresh
   campaign on a zoomed/HiDPI screen used to paint into the top-left
   corner), node markers stay on the hero's current page (the retired
   `mi` anchor field let every region's nodes bleed onto every page),
   and the six once-skinless rigs now carry their original armor art.
   Presentation only — SM-2 state and the meters never move. */
const { test } = require('@playwright/test');
const { freshGame, expect } = require('./helpers');

test.use({ deviceScaleFactor: 2 });

test('node anchors belong only to the page they ride', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    const hp = { key: 'PP', page: 0 };
    return {
      same: wf.mpOnPage({ key: 'PP', page: 0, pi: 3 }, hp),
      otherSet: wf.mpOnPage({ key: 'PF', page: 0, pi: 3 }, hp),
      otherPage: wf.mpOnPage({ key: 'PP', page: 2, pi: 3 }, hp),
      unanchored: wf.mpOnPage(undefined, hp),       // the old `mi` bug class
      nowhere: wf.mpOnPage({ key: 'PP', page: 0 }, null),
    };
  });
  expect(out.same).toBe(true);
  expect(out.otherSet).toBe(false);
  expect(out.otherPage).toBe(false);
  expect(out.unanchored).toBe(false);
  expect(out.nowhere).toBe(false);
});

test('the world paints edge to edge on a HiDPI screen', async ({ page }) => {
  await freshGame(page, 'c');
  // wait until the far corner shows the original map (not the boot fill, not bare canvas)
  const ok = await page.waitForFunction(() => {
    const cv = document.getElementById('cv');
    if (!cv || !cv.width) return false;
    if (Math.abs(cv.width - Math.round(cv.clientWidth * window.devicePixelRatio)) > 2) return false;
    const px = cv.getContext('2d').getImageData(cv.width - 3, cv.height - 3, 1, 1).data;
    const bootFill = px[0] === 20 && px[1] === 16 && px[2] === 33;   // #141021
    return px[3] === 255 && !bootFill;
  }, null, { timeout: 20000 });
  expect(ok).toBeTruthy();
});

test('the six re-skinned rigs wear their original armor art', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const R = window.__wf.DATA.eaRig;
    const keys = ['desire', 'werewolf', 'bear', 'sylvan', 'shriek', 'arcaneHorror'];
    return {
      whole: keys.every(k => R[k] && R[k].portrait &&
        ['idle', 'strike', 'dmg', 'death', 'fwd'].every(a => R[k].anims[a] && R[k].anims[a].f.length > 0)),
      desireDs: R.desire.ds,
    };
  });
  expect(out.whole).toBe(true);
  expect(out.desireDs).toBeCloseTo(1.1);   // battle sizing unchanged by the reskin
});
