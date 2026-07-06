// @ts-check
const { test, expect } = require('@playwright/test');
const { loadGame, freshGame } = require('./helpers');

/* Slice 10 of the iPhone plan: when both devices studied, the save merge
   keeps, per concept, whichever record reflects the most recent review — and
   can never mint a record neither device earned. Pure logic at the bridge
   seam, plus the end-to-end path through a stubbed endpoint. */

/* timestamps ride the game clock (Date.now() ms) and must be recent — the
   start-of-game decay pass treats ancient 'last' values as long neglect */
const T = Date.now();
const rec = (reps, last) => ({ reps, ease: 2.5, iv: reps * 3, due: T + 86400000, last, seen: last, lapse: 0 });

test('per-concept newest-wins, in both directions, deterministically', async ({ page }) => {
  await loadGame(page);
  const out = await page.evaluate(() => {
    const m = window.__wf.mergeSr;
    const local = {
      'c:only-local': { reps: 1, last: 50, seen: 50 },
      'c:local-newer': { reps: 4, last: 200, seen: 200 },
      'c:remote-newer': { reps: 1, last: 100, seen: 100 },
    };
    const remote = {
      'c:only-remote': { reps: 2, last: 80, seen: 80 },
      'c:local-newer': { reps: 2, last: 100, seen: 100 },
      'c:remote-newer': { reps: 3, last: 300, seen: 300 },
    };
    const a = m(local, remote);
    const b = m(local, remote);
    return { a, same: JSON.stringify(a) === JSON.stringify(b) };
  });

  expect(out.a['c:only-local'].reps).toBe(1);      // studied on one device: kept
  expect(out.a['c:only-remote'].reps).toBe(2);     // studied on the other: adopted
  expect(out.a['c:local-newer'].reps).toBe(4);     // most recent review wins…
  expect(out.a['c:remote-newer'].reps).toBe(3);    // …in either direction
  expect(out.same).toBe(true);                     // identical inputs, identical output
});

test('a merge can never mint a record neither device earned', async ({ page }) => {
  await loadGame(page);
  const out = await page.evaluate(() => {
    const m = window.__wf.mergeSr;
    const local = { 'c:a': { reps: 2, last: 10, seen: 10 } };
    const remote = { 'c:b': { reps: 1, last: 20, seen: 20 } };
    const merged = m(local, remote);
    const inputs = JSON.stringify([local['c:a'], remote['c:b']]);
    return {
      keys: Object.keys(merged).sort(),
      everyFromAnInput: Object.entries(merged).every(([k, r]) =>
        inputs.includes(JSON.stringify(r))
      ),
    };
  });
  expect(out.keys).toEqual(['c:a', 'c:b']);        // exactly the union, nothing invented
  expect(out.everyFromAnInput).toBe(true);         // every record IS one of the inputs
});

test('starting a game merges a conflicting remote by review recency', async ({ page }) => {
  const remote = {
    v: 1,
    savedAt: T,
    sr: {
      'c:stale-on-remote': rec(9, T - 2000),   // local studied this more recently
      'c:fresh-on-remote': rec(3, T - 1000),   // remote studied this more recently
    },
  };
  await page.route('**/save', (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(remote) })
      : route.fulfill({ status: 204 })
  );
  await freshGame(page, 'c');
  await page.evaluate((t) => {
    const sr = window.__wf.S.sr;
    sr['c:stale-on-remote'] = { reps: 2, ease: 2.5, iv: 6, due: t + 86400000, last: t - 1000, seen: t - 1000, lapse: 0 };
    sr['c:fresh-on-remote'] = { reps: 1, ease: 2.5, iv: 3, due: t + 86400000, last: t - 2000, seen: t - 2000, lapse: 0 };
    window.startGame(false);
  }, T);

  await expect
    .poll(() => page.evaluate(() => window.__wf.S.sr['c:fresh-on-remote'].reps))
    .toBe(3);                                       // remote's fresher record adopted
  expect(await page.evaluate(() => window.__wf.S.sr['c:stale-on-remote'].reps)).toBe(2); // local kept
});
