// @ts-check
/* Commit 2 — domain typing + super-effective.
   A battle is typed to its region's cert domain. Answering with knowledge you
   have MASTERED in that domain lands super-effective (x2); a domain you are weak
   in makes the foe's blows hit harder. None of this changes how mastery accrues. */
const { test } = require('@playwright/test');
const { freshGame, expect } = require('./helpers');

/* set a minimal battle context for the pure typing helpers */
async function setBattle(page, track, dom) {
  await page.evaluate(({ tk, d }) => {
    window.__wf.B = { region: { dom: d, cert: tk }, cert: tk, q: null, qCert: tk };
  }, { tk: track, d: dom });
}

/* find one concept in `dom` and one in a different domain */
async function twoDomainConcepts(page, track) {
  return page.evaluate((tk) => {
    const wf = window.__wf, all = wf.ALLCONCEPTS[tk];
    const inDom = {};
    for (const c of all) { const d = wf.CONCEPT_DOM[tk][c]; (inDom[d] ||= []).push(c); }
    const domsWithConcepts = Object.keys(inDom).map(Number);
    const a = domsWithConcepts[0], b = domsWithConcepts.find(d => d !== a);
    return { domA: a, conceptA: inDom[a][0], domB: b, conceptB: inDom[b][0] };
  }, track);
}

/* master a single concept in-page by forcing each recall to be due */
async function master(page, track, concept) {
  await page.evaluate(({ tk, c }) => {
    const wf = window.__wf, key = wf.srKey(tk, c);
    for (let i = 0; i < 6 && wf.srState(key) !== 'mastered'; i++) {
      if (wf.S.sr[key]) wf.S.sr[key].due = 0;
      wf.srAnswer(tk, c, true, false);
    }
  }, { tk: track, c: concept });
}

test('battleDom reports the region domain', async ({ page }) => {
  await freshGame(page, 'c');
  await setBattle(page, 'c', 2);
  expect(await page.evaluate(() => window.__wf.battleDom())).toBe(2);
});

test('super-effective only fires for MASTERED knowledge in the battle domain', async ({ page }) => {
  await freshGame(page, 'c');
  const { domA, conceptA, conceptB } = await twoDomainConcepts(page, 'c');
  await setBattle(page, 'c', domA);

  // unmastered in-domain concept: not super-effective
  expect(await page.evaluate((c) => window.__wf.isSuperEffective('c', c), conceptA)).toBe(false);

  // master it -> super-effective
  await master(page, 'c', conceptA);
  expect(await page.evaluate((c) => window.__wf.isSuperEffective('c', c), conceptA)).toBe(true);

  // a mastered concept from a DIFFERENT domain is not super-effective here
  await master(page, 'c', conceptB);
  expect(await page.evaluate((c) => window.__wf.isSuperEffective('c', c), conceptB)).toBe(false);
});

test('attackDamage doubles on super-effective and halves on a glancing (hinted) hit', async ({ page }) => {
  await freshGame(page, 'c');
  const { domA, conceptA } = await twoDomainConcepts(page, 'c');
  await setBattle(page, 'c', domA);

  // baseline: unmastered, no super-effective -> unchanged
  expect(await page.evaluate((c) => window.__wf.attackDamage(2, 'c', c, {}), conceptA)).toBe(2);

  await master(page, 'c', conceptA);
  // super-effective doubles 2 -> 4
  expect(await page.evaluate((c) => window.__wf.attackDamage(2, 'c', c, {}), conceptA)).toBe(4);
  // glancing halves the doubled value 4 -> 2 (floor), and never below 1 for a real hit
  expect(await page.evaluate((c) => window.__wf.attackDamage(2, 'c', c, { hinted: true }), conceptA)).toBe(2);
});

test('domDanger: a weak domain adds foe danger, a mastered domain does not', async ({ page }) => {
  await freshGame(page, 'c');
  // weak (nothing mastered) -> +1 danger
  expect(await page.evaluate(() => window.__wf.domDanger('c', 0))).toBe(1);

  // master enough of domain 0 to cross 34% -> danger clears
  await page.evaluate(() => {
    const wf = window.__wf, cs = Object.keys(wf.QIDX.c[0] || {});
    const need = Math.ceil(cs.length * 0.4);
    for (let i = 0; i < need; i++) {
      const key = wf.srKey('c', cs[i]);
      for (let r = 0; r < 6 && wf.srState(key) !== 'mastered'; r++) {
        if (wf.S.sr[key]) wf.S.sr[key].due = 0;
        wf.srAnswer('c', cs[i], true, false);
      }
    }
  });
  expect(await page.evaluate(() => window.__wf.domDanger('c', 0))).toBe(0);
});
