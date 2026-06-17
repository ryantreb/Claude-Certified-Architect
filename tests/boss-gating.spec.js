// @ts-check
/* Commit 6 — cooldown-gated multi-phase bosses.
   Clearing a phase opens a lock that needs the same two keys mastery needs:
   >=3 qualifying due-recalls in the boss's domain AND >=3 weave-days elapsed.
   The lethal phase is unreachable in one sitting. */
const { test } = require('@playwright/test');
const { freshGame, expect } = require('./helpers');

/* the first boss region of the Loom track */
async function bossRegion(page) {
  return page.evaluate(() => {
    const wf = window.__wf;
    const r = wf.trackRegions('c').find(x => x.boss);
    return { id: r.id, dom: r.dom, boss: r.boss };
  });
}

test('opening phase is attemptable; later phases gate on recalls AND weave-days', async ({ page }) => {
  await freshGame(page, 'c');
  const r = await bossRegion(page);
  const out = await page.evaluate((id) => {
    const wf = window.__wf;
    const region = wf.trackRegions('c').find(x => x.id === id);
    const st = wf.regState(id);
    st.wins = 3;                                   // region softened, boss reachable
    const openReady = wf.bossPhaseReady(region);   // phase 0 -> always ready
    // clear phase 1
    st.phase = 1; st.phaseAt = Date.now(); st.recallsSince = 0;
    const afterPhase = {
      ready: wf.bossPhaseReady(region),
      cooldownLeft: wf.bossCooldownLeft(region),
      recallsLeft: wf.bossRecallsLeft(region),
    };
    return { openReady, afterPhase };
  }, r.id);
  expect(out.openReady).toBe(true);
  expect(out.afterPhase.ready).toBe(false);                 // sealed right after a phase clear
  expect(out.afterPhase.cooldownLeft).toBeGreaterThan(0);   // weave-days must turn
  expect(out.afterPhase.recallsLeft).toBe(3);               // and due-recalls must accrue
});

test('weave-cooldown alone does not open the phase — recalls are still required', async ({ page }) => {
  await freshGame(page, 'c');
  const r = await bossRegion(page);
  const ready = await page.evaluate((id) => {
    const wf = window.__wf, region = wf.trackRegions('c').find(x => x.id === id);
    const st = wf.regState(id);
    st.wins = 3; st.phase = 1; st.recallsSince = 0;
    st.phaseAt = Date.now() - (wf.MASTER_IV * wf.GAME_DAY) - 1000;   // cooldown fully elapsed
    return { ready: wf.bossPhaseReady(region), recallsLeft: wf.bossRecallsLeft(region) };
  }, r.id);
  expect(ready.recallsLeft).toBe(3);
  expect(ready.ready).toBe(false);                 // time passed, but no reviews done
});

test('recalls alone do not open the phase — the weave-cooldown is still required', async ({ page }) => {
  await freshGame(page, 'c');
  const r = await bossRegion(page);
  const ready = await page.evaluate((id) => {
    const wf = window.__wf, region = wf.trackRegions('c').find(x => x.id === id);
    const st = wf.regState(id);
    st.wins = 3; st.phase = 1; st.phaseAt = Date.now();   // just cleared -> full cooldown ahead
    st.recallsSince = 5;                                  // plenty of reviews
    return { ready: wf.bossPhaseReady(region), cd: wf.bossCooldownLeft(region) };
  }, r.id);
  expect(ready.cd).toBeGreaterThan(0);
  expect(ready.ready).toBe(false);                 // reviews done, but the weave has not turned
});

test('both keys satisfied opens the next phase', async ({ page }) => {
  await freshGame(page, 'c');
  const r = await bossRegion(page);
  const ready = await page.evaluate((id) => {
    const wf = window.__wf, region = wf.trackRegions('c').find(x => x.id === id);
    const st = wf.regState(id);
    st.wins = 3; st.phase = 1;
    st.phaseAt = Date.now() - (wf.MASTER_IV * wf.GAME_DAY) - 1000;   // cooldown elapsed
    st.recallsSince = wf.MASTER_REPS;                                // and recalls accrued
    return wf.bossPhaseReady(region);
  }, r.id);
  expect(ready).toBe(true);
});

test('only DUE-review recalls in the boss domain count toward thawing it', async ({ page }) => {
  await freshGame(page, 'c');
  const r = await bossRegion(page);
  const out = await page.evaluate((rg) => {
    const wf = window.__wf;
    const st = wf.regState(rg.id);
    st.wins = 3; st.phase = 1; st.recallsSince = 0;   // boss in progress
    const domConcept = wf.ALLCONCEPTS.c.find(c => wf.CONCEPT_DOM.c[c] === rg.dom);

    // a NON-due first-time recall (kind 'advance' but wasDue false) must NOT count
    wf.creditBossRecall('c', domConcept, { kind: 'advance', wasDue: false });
    const afterNonDue = wf.regState(rg.id).recallsSince;

    // a genuine due recall counts
    wf.creditBossRecall('c', domConcept, { kind: 'advance', wasDue: true });
    const afterDue = wf.regState(rg.id).recallsSince;

    // a due recall in a DIFFERENT domain does not count
    const otherConcept = wf.ALLCONCEPTS.c.find(c => wf.CONCEPT_DOM.c[c] !== rg.dom);
    wf.creditBossRecall('c', otherConcept, { kind: 'advance', wasDue: true });
    const afterOtherDom = wf.regState(rg.id).recallsSince;

    return { afterNonDue, afterDue, afterOtherDom };
  }, r);
  expect(out.afterNonDue).toBe(0);
  expect(out.afterDue).toBe(1);
  expect(out.afterOtherDom).toBe(1);   // unchanged by the off-domain recall
});
