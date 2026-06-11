// @ts-check
/* Baseline smoke tests — lock the *existing* behavior and the immutable honesty
   rules before any positioning-layer work. These must stay green throughout. */
const { test } = require('@playwright/test');
const { loadGame, freshGame, aConcept, forceMaster, expect } = require('./helpers');

test('title screen renders with the core entry points', async ({ page }) => {
  await loadGame(page);
  await expect(page.locator('#gameTitle')).toHaveText('WEAVEFALL');
  await expect(page.locator('#btnNewGame')).toBeVisible();
  await expect(page.locator('#btnTitleHow')).toBeVisible();
});

test('engine globals are exposed for the spaced-repetition core', async ({ page }) => {
  await loadGame(page);
  const present = await page.evaluate(() => {
    const wf = window.__wf;
    return ['newState','srAnswer','srState','meterOf','conceptScore','dueConcepts',
      'ALLCONCEPTS','CONCEPT_DOM','MASTER_REPS','MASTER_IV'].every(k => wf[k] !== undefined);
  });
  expect(present).toBe(true);
});

test('IMMUTABLE: a single correct answer never grants mastery or meter credit', async ({ page }) => {
  await freshGame(page, 'c');
  const { concept } = await aConcept(page, 'c');
  const out = await page.evaluate((c) => {
    const key = window.__wf.srKey('c', c);
    const before = window.__wf.meterOf('c').total;
    window.__wf.S.sr[key] = undefined;            // unseen
    const res = window.__wf.srAnswer('c', c, true, false);   // ONE correct answer
    return {
      state: window.__wf.srState(key),
      conceptScore: window.__wf.conceptScore(key),
      meterDelta: window.__wf.meterOf('c').total - before,
      kind: res.kind,
      masteredNow: res.masteredNow,
    };
  }, concept);
  expect(out.state).not.toBe('mastered');
  expect(out.conceptScore).toBe(0);          // no partial credit from one answer
  expect(out.meterDelta).toBe(0);            // meters move only on mastery
  expect(out.masteredNow).toBe(false);
});

test('IMMUTABLE: mastery requires >=3 spaced recalls with interval >= 3 weave-days', async ({ page }) => {
  await freshGame(page, 'c');
  const { concept } = await aConcept(page, 'c');
  const r = await forceMaster(page, 'c', concept);
  expect(r.state).toBe('mastered');
  expect(r.reps).toBeGreaterThanOrEqual(3);
  expect(r.iv).toBeGreaterThanOrEqual(3);
});

test('IMMUTABLE: a wrong answer resets the concept reps to zero', async ({ page }) => {
  await freshGame(page, 'c');
  const { concept } = await aConcept(page, 'c');
  const reps = await page.evaluate((c) => {
    const key = window.__wf.srKey('c', c);
    window.__wf.S.sr[key] = undefined;
    window.__wf.srAnswer('c', c, true, false);    // reps -> 1
    const mid = window.__wf.S.sr[key].reps;
    window.__wf.srAnswer('c', c, false, false);   // wrong -> reps reset
    return { mid, after: window.__wf.S.sr[key].reps };
  }, concept);
  expect(reps.mid).toBeGreaterThanOrEqual(1);
  expect(reps.after).toBe(0);
});

test('IMMUTABLE: a hinted correct answer earns no recall credit', async ({ page }) => {
  await freshGame(page, 'c');
  const { concept } = await aConcept(page, 'c');
  const out = await page.evaluate((c) => {
    const key = window.__wf.srKey('c', c);
    window.__wf.S.sr[key] = undefined;
    const res = window.__wf.srAnswer('c', c, true, true);   // correct but hinted
    return { kind: res.kind, reps: (window.__wf.S.sr[key] || {}).reps };
  }, concept);
  expect(out.kind).toBe('hinted');
  expect(out.reps).toBe(0);
});
