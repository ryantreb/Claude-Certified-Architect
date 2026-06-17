// @ts-check
/* Shared helpers for Weavefall tests.
   The game is non-module <script> blocks, so its `let`/`const` globals are NOT
   window properties. index.html exposes a gameplay-inert `window.__wf` bridge
   with live getters/setters; the tests drive the pure spaced-repetition / combat
   logic through it rather than through the canvas. */

const { expect } = require('@playwright/test');

/** Load the game and wait until boot() has populated the bridge. */
async function loadGame(page) {
  await page.goto('/index.html');
  await page.waitForFunction(() => !!window.__wf && !!window.__wf.S);
}

/** Reset to a clean, started game on the given track ('c' = Loom, 'g' = Forge). */
async function freshGame(page, track = 'c') {
  await loadGame(page);
  await page.evaluate((tk) => {
    try { localStorage.clear(); } catch (e) {}
    const wf = window.__wf;
    wf.S = wf.newState();
    wf.S.track = tk;
    wf.S.started = true;
    wf.S.session = wf.freshSession();
  }, track);
}

/** A concept key that exists on the track, with its domain index. */
async function aConcept(page, track = 'c') {
  return page.evaluate((tk) => {
    const wf = window.__wf;
    const c = wf.ALLCONCEPTS[tk][0];
    return { concept: c, dom: wf.CONCEPT_DOM[tk][c] };
  }, track);
}

/** Drive a concept all the way to "mastered" by forcing each recall to be due.
    Mirrors what the engine does, but collapses the weave-day timers for the test. */
async function forceMaster(page, track, concept) {
  return page.evaluate(({ tk, c }) => {
    const wf = window.__wf;
    const key = wf.srKey(tk, c);
    for (let i = 0; i < 6; i++) {
      if (wf.S.sr[key]) wf.S.sr[key].due = 0;   // make it due now
      wf.srAnswer(tk, c, true, false);          // a real (non-hinted) recall
      if (wf.srState(key) === 'mastered') break;
    }
    return { state: wf.srState(key), reps: wf.S.sr[key].reps, iv: wf.S.sr[key].iv };
  }, { tk: track, c: concept });
}

module.exports = { loadGame, freshGame, aConcept, forceMaster, expect };
