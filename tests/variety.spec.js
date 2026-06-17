// @ts-check
/* Question variety. Two guarantees against the "same 5 questions" problem:
   1. depth    — every Orchestration (c0) concept has enough variants that spaced
                 review can't ping-pong between two items.
   2. spread   — the variant selector cycles a concept's whole pool before any
                 question repeats (avoids a window of recent ids, not just one). */
const { test, expect } = require('@playwright/test');
const { loadGame } = require('./helpers');

test('every Orchestration (c0) concept has at least 4 question variants', async ({ page }) => {
  await loadGame(page);
  const counts = await page.evaluate(() => {
    const q = window.__wf.QIDX.c[0], out = {};
    for (const c of Object.keys(q)) out[c] = q[c].length;
    return out;
  });
  for (const [concept, n] of Object.entries(counts)) {
    expect(n, `c0 concept "${concept}" should have >=4 variants (has ${n})`).toBeGreaterThanOrEqual(4);
  }
});

test('the variant selector cycles a concept pool before repeating any question', async ({ page }) => {
  await loadGame(page);
  const res = await page.evaluate(() => {
    const wf = window.__wf;
    wf.S = wf.newState();                       // fresh state: empty per-concept recent-id history
    const concept = 'workflow-vs-agent';
    const K = wf.QIDX.c[0][concept].length;
    const seq = [];
    for (let i = 0; i < K * 4; i++) seq.push(wf.pickQuestion('c', [concept], []).id);
    // the selector avoids the last K-1 ids, so any window of K consecutive draws must be all-distinct
    let violation = null;
    for (let i = 0; i < seq.length && !violation; i++) {
      for (let j = Math.max(0, i - (K - 1)); j < i; j++) {
        if (seq[j] === seq[i]) { violation = { i, j, id: seq[i] }; break; }
      }
    }
    return { K, firstKDistinct: new Set(seq.slice(0, K)).size, violation };
  });
  expect(res.K).toBeGreaterThanOrEqual(4);
  expect(res.firstKDistinct, 'the first K draws should be K distinct questions').toBe(res.K);
  expect(res.violation, 'no question should repeat within a window of K draws').toBeNull();
});
