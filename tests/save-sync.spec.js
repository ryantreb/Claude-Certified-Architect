// @ts-check
const { test, expect } = require('@playwright/test');
const { freshGame, aConcept } = require('./helpers');

/* Slice 9 of the iPhone plan: silent save plumbing between the game and the
   tailnet save endpoint (contract: docs/save-endpoint.md). Boot pulls; play
   pushes debounced snapshots; an absent endpoint changes nothing at all —
   localStorage remains the state the game runs from. Stubbed at the route,
   exactly the shape the contract documents. */

const REMOTE_KEY = 'c:loop-control';
const REMOTE_BLOB = {
  v: 1,
  savedAt: 1780000000000,
  sr: { [REMOTE_KEY]: { reps: 2, ease: 2.5, iv: 5, due: 0, last: 0, seen: 123, lapse: 0 } },
};

test('starting a game adopts remote concepts this device has never seen', async ({ page }) => {
  await page.route('**/save', (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(REMOTE_BLOB) })
      : route.fulfill({ status: 204 })
  );
  await freshGame(page, 'c');
  await page.evaluate(() => window.startGame(false));

  await expect
    .poll(() => page.evaluate((k) => window.__wf.S.sr[k] && window.__wf.S.sr[k].reps, REMOTE_KEY))
    .toBe(2);
});

test('play pushes one debounced snapshot carrying the earned state', async ({ page }) => {
  /** @type {any[]} */
  const puts = [];
  await page.route('**/save', (route) => {
    if (route.request().method() === 'PUT') puts.push(route.request().postDataJSON());
    return route.request().method() === 'GET'
      ? route.fulfill({ status: 204 })
      : route.fulfill({ status: 204 });
  });
  await freshGame(page, 'c');
  await page.evaluate(() => window.startGame(false));
  const { concept } = await aConcept(page, 'c');

  // a rapid burst of study activity must collapse into few pushes
  await page.evaluate((c) => {
    const wf = window.__wf;
    for (let i = 0; i < 3; i++) {
      if (wf.S.sr[wf.srKey('c', c)]) wf.S.sr[wf.srKey('c', c)].due = 0;
      wf.srAnswer('c', c, true, false);
    }
  }, concept);

  await expect.poll(() => puts.length, { timeout: 10000 }).toBeGreaterThan(0);
  expect(puts.length).toBeLessThanOrEqual(2);
  const last = puts[puts.length - 1];
  expect(last.v).toBe(1);
  expect(last.sr[`c:${concept}`].reps).toBeGreaterThan(0);
});

test('with no endpoint at all the game plays exactly as before', async ({ page }) => {
  // no route stub: the dev server 404s GET /save and rejects PUT — the game
  // must neither crash nor change behavior
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await freshGame(page, 'c');
  await page.evaluate(() => window.startGame(false));
  const { concept } = await aConcept(page, 'c');
  const reps = await page.evaluate((c) => {
    const wf = window.__wf;
    wf.srAnswer('c', c, true, false);
    return wf.S.sr[wf.srKey('c', c)].reps;
  }, concept);
  expect(reps).toBe(1);
  await page.waitForTimeout(3000);   // let any debounced push fire and fail
  expect(errors).toEqual([]);
});
