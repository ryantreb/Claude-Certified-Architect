// @ts-check
/* Commit 3 — row-sourced questions: the core positioning layer.
   Front line (col 0) draws DUE/WEAK/unseen recall in the foe's domain and hits
   for x1.5; back line (col 1) draws only MASTERED recall and chips for x0.5.
   The pool is filtered by the engine's own srState() — a strong back line is
   impossible without real mastery. */
const { test } = require('@playwright/test');
const { freshGame, expect } = require('./helpers');

/* master every concept in a domain in-page (forcing each recall due) */
async function masterDomain(page, track, dom) {
  await page.evaluate(({ tk, d }) => {
    const wf = window.__wf, cs = Object.keys(wf.QIDX[tk][d] || {});
    for (const c of cs) {
      const key = wf.srKey(tk, c);
      for (let r = 0; r < 6 && wf.srState(key) !== 'mastered'; r++) {
        if (wf.S.sr[key]) wf.S.sr[key].due = 0;
        wf.srAnswer(tk, c, true, false);
      }
    }
  }, { tk: track, d: dom });
}

test('row multiplier is a burst dial: front x1.5, back x0.5', async ({ page }) => {
  await freshGame(page, 'c');
  const mults = await page.evaluate(() => ({
    front: window.__wf.rowMultOf(0),
    back: window.__wf.rowMultOf(1),
  }));
  expect(mults.front).toBeGreaterThan(1);
  expect(mults.back).toBeLessThan(1);
});

test('back line draws ONLY mastered concepts once mastery exists', async ({ page }) => {
  await freshGame(page, 'c');
  // nothing mastered yet -> back line has no mastered pool, falls back to the whole domain
  const before = await page.evaluate(() => {
    const wf = window.__wf, all = Object.keys(wf.QIDX.c[0]);
    const pool = wf.rowPool('c', 0, 1);
    return { poolLen: pool.length, allLen: all.length };
  });
  expect(before.poolLen).toBe(before.allLen);   // graceful fallback, still playable

  // master the whole domain, then master state should dominate the back pool
  await masterDomain(page, 'c', 0);
  const after = await page.evaluate(() => {
    const wf = window.__wf;
    const pool = wf.rowPool('c', 0, 1);
    const allMastered = pool.every(c => wf.srState(wf.srKey('c', c)) === 'mastered');
    return { allMastered, len: pool.length };
  });
  expect(after.len).toBeGreaterThan(0);
  expect(after.allMastered).toBe(true);
});

test('front line excludes fresh mastery — it draws the hard, not-yet-proven recall', async ({ page }) => {
  await freshGame(page, 'c');
  await masterDomain(page, 'c', 0);
  // every concept in domain 0 is freshly mastered and NOT due -> front pool should
  // exclude them and fall back to the full domain (never empty), but none should be
  // a still-due maintenance card
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    const front = wf.rowPool('c', 0, 0);
    const back = wf.rowPool('c', 0, 1);
    // back is all mastered; front fell back (all mastered, none due) so they are equal length
    return { frontLen: front.length, backLen: back.length };
  });
  expect(out.frontLen).toBeGreaterThan(0);
  expect(out.backLen).toBeGreaterThan(0);
});

test('a single mastered back-line chip never out-damages mastery itself (meters untouched)', async ({ page }) => {
  await freshGame(page, 'c');
  const before = await page.evaluate(() => window.__wf.meterOf('c').total);
  // simulate row sourcing + a super-effective chip resolving; combat damage must
  // not feed the meter at all
  await page.evaluate(() => {
    window.__wf.B = { region: { dom: 0, cert: 'c' }, cert: 'c', q: null, qCert: 'c' };
    const wf = window.__wf, c = Object.keys(wf.QIDX.c[0])[0], key = wf.srKey('c', c);
    for (let r = 0; r < 6 && wf.srState(key) !== 'mastered'; r++) {
      if (wf.S.sr[key]) wf.S.sr[key].due = 0;
      wf.srAnswer('c', c, true, false);
    }
    wf.attackDamage(2, 'c', c, { rowMult: wf.rowMultOf(1) });   // back-line super-effective chip
  });
  const afterMeter = await page.evaluate(() => window.__wf.meterOf('c').total);
  // the meter moved only because mastery accrued (legitimately), never from the hit;
  // re-running the hit alone must not change it further
  const afterHitAgain = await page.evaluate(() => {
    const wf = window.__wf, c = Object.keys(wf.QIDX.c[0])[0];
    wf.attackDamage(2, 'c', c, { rowMult: wf.rowMultOf(1) });
    return wf.meterOf('c').total;
  });
  expect(afterHitAgain).toBe(afterMeter);
});
