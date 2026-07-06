// @ts-check
const { test, expect } = require('@playwright/test');
const { freshGame, IPHONE_13_PRO_MAX } = require('./helpers');

/* Slice 4 of the iPhone plan: the game renders edge-to-edge on the notched
   phone and keeps its chrome out of the notch and home indicator. The page
   opts into cover viewport and the fixed UI consumes safe-area insets. In
   emulation the insets resolve to zero, so the inset *consumption* is locked
   at the stylesheet contract and the geometry is locked as "inside the
   viewport" — the real-notch pass lives in the device checklist (#16). */

test.describe('phone viewport and safe areas', () => {
  test.use(IPHONE_13_PRO_MAX);

  test('the mobile build opts into cover viewport and consumes the insets', async ({ page, request }) => {
    const html = await (await request.get('/mobile/index.html')).text();

    const viewport = html.match(/<meta name="viewport" content="([^"]*)"/);
    expect(viewport && viewport[1]).toContain('viewport-fit=cover');

    // the chrome that hugs screen edges must pad by the matching inset
    for (const [selector, inset] of [
      ['#hud', 'safe-area-inset-top'],
      ['#battleUI', 'safe-area-inset-bottom'],
      ['#dpad', 'safe-area-inset-bottom'],
    ]) {
      const rule = new RegExp(
        selector + '\\{[^}]*env\\(' + inset + '\\)[^}]*\\}'
      );
      expect(html, `${selector} must consume env(${inset})`).toMatch(rule);
    }
  });

  test('the HUD sits inside the phone viewport edge to edge', async ({ page }) => {
    await freshGame(page, 'c', '/mobile/index.html');
    await page.evaluate(() => window.startGame(false));
    await page.locator('#hud').waitFor({ state: 'visible' });
    const box = await page.locator('#hud').boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(428);
    }
  });
});
